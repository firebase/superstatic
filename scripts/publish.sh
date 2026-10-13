#!/bin/bash
set -euo pipefail

printusage() {
  echo "Usage: ./scripts/publish.sh <version> [branch]"
  echo ""
  echo "Arguments:"
  echo "  version: 'patch', 'minor', 'major', or 'preview'"
  echo "  branch:  optional branch for 'preview' (defaults to current branch if omitted)"
}

VERSION="${1:-}"
BRANCH="${2:-}"
GCP_PROJECT="${GCP_PROJECT:-fir-tools-builds}"
BUILDER_SA="${BUILDER_SA:-superstatic-builder@${GCP_PROJECT}.iam.gserviceaccount.com}"
EXIT_GATE_GCS_MANIFEST="gs://oss-exit-gate-prod-projects-bucket/superstatic/npm/manifests/publish_manifest.json"
CHANGELOG_FILE="changelog.txt"

if [[ -z "${VERSION}" ]]; then
  printusage
  exit 1
fi

if [[ "${VERSION}" != "patch" && "${VERSION}" != "minor" && "${VERSION}" != "major" && "${VERSION}" != "preview" ]]; then
  printusage
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
cd "${REPO_ROOT}"

echo "==> Checking required CLI tools (git, jq, npm, gcloud, gh)..."
for cmd in git jq npm gcloud gh; do
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "Error: Required command '${cmd}' not found on PATH." >&2
    exit 1
  fi
done

if [[ "${VERSION}" != "preview" ]]; then
  echo "==> Verifying GitHub CLI authentication..."
  gh auth status >/dev/null
fi

echo "==> Verifying clean git working tree..."
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: Working tree has uncommitted changes. Please commit and push (or stash) them before releasing." >&2
  git status --short
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "${VERSION}" == "preview" ]]; then
  TARGET_BRANCH="${BRANCH:-${CURRENT_BRANCH}}"
else
  if [[ "${CURRENT_BRANCH}" != "main" ]]; then
    echo "Error: Standard releases (patch/minor/major) must be run from the 'main' branch (currently on '${CURRENT_BRANCH}')." >&2
    exit 1
  fi
  TARGET_BRANCH="main"
fi

echo "==> Fetching origin/${TARGET_BRANCH}..."
if ! git fetch origin "${TARGET_BRANCH}"; then
  echo "Error: Could not fetch branch '${TARGET_BRANCH}' from origin. Make sure it is pushed to GitHub." >&2
  exit 1
fi

REMOTE_SHA="$(git rev-parse "origin/${TARGET_BRANCH}")"
if [[ "${CURRENT_BRANCH}" == "${TARGET_BRANCH}" ]]; then
  LOCAL_SHA="$(git rev-parse HEAD)"
  if [[ "${LOCAL_SHA}" != "${REMOTE_SHA}" ]]; then
    echo "Error: Local branch '${TARGET_BRANCH}' (${LOCAL_SHA}) does not match 'origin/${TARGET_BRANCH}' (${REMOTE_SHA})." >&2
    echo "Because Cloud Build clones directly from GitHub, please git push/pull first." >&2
    exit 1
  fi
fi

if [[ "${VERSION}" != "preview" ]]; then
  echo "==> Checking ${CHANGELOG_FILE} on origin/main..."
  if [[ ! -s "${CHANGELOG_FILE}" ]]; then
    echo "Error: ${CHANGELOG_FILE} is empty. Commit and push release notes in ${CHANGELOG_FILE} before releasing." >&2
    exit 1
  fi
fi

TEMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "${TEMP_DIR}"
}
trap cleanup EXIT

# Compute target version in an isolated temp directory from origin/${TARGET_BRANCH}:package.json
# so the local working tree stays untouched until the release succeeds.
git show "origin/${TARGET_BRANCH}:package.json" > "${TEMP_DIR}/package.json"

if [[ "${VERSION}" == "preview" ]]; then
  SANITIZED_BRANCH="$(echo "${TARGET_BRANCH}" | sed 's/[^a-zA-Z0-9]/-/g')"
  echo "==> Computing preview version for branch '${TARGET_BRANCH}' (${REMOTE_SHA})..."

  (cd "${TEMP_DIR}" && npm version prerelease --preid="${SANITIZED_BRANCH}" --no-git-tag-version >/dev/null)
  INITIAL_VERSION="$(jq -r '.version' "${TEMP_DIR}/package.json")"
  PREFIX="${INITIAL_VERSION%.*}"

  MATCHING_VERSIONS="$(npm view superstatic versions --registry=https://registry.npmjs.org --json 2>/dev/null | jq -r --arg prefix "${PREFIX}" 'if type == "array" then .[] else . end | select(startswith($prefix + "."))' || true)"
  if [[ -n "${MATCHING_VERSIONS}" ]]; then
    MAX_SUFFIX="$(echo "${MATCHING_VERSIONS}" | sed 's/^.*\.//' | grep -E '^[0-9]+$' | sort -n | tail -n 1 || true)"
    MAX_SUFFIX="${MAX_SUFFIX:-0}"
    NEXT_SUFFIX=$((MAX_SUFFIX + 1))
    NEW_VERSION="${PREFIX}.${NEXT_SUFFIX}"
  else
    NEW_VERSION="${INITIAL_VERSION}"
  fi
  NPM_TAG="preview"
  echo "==> Preview version will be ${NEW_VERSION} (dist-tag: ${NPM_TAG})"
else
  echo "==> Computing ${VERSION} version bump from origin/main (${REMOTE_SHA})..."
  (cd "${TEMP_DIR}" && npm version "${VERSION}" --no-git-tag-version >/dev/null)
  NEW_VERSION="$(jq -r '.version' "${TEMP_DIR}/package.json")"
  NPM_TAG="latest"
  echo "==> Target release version is ${NEW_VERSION}"
fi

echo "==> Step 1/4: Cloning '${TARGET_BRANCH}' (${REMOTE_SHA}), testing, and staging superstatic@${NEW_VERSION} in Cloud Build (${GCP_PROJECT})..."
gcloud --project="${GCP_PROJECT}" builds submit \
  --no-source \
  --config=scripts/publish/cloudbuild.yaml \
  --substitutions="_VERSION=${NEW_VERSION},_NPM_TAG=${NPM_TAG},_BRANCH=${TARGET_BRANCH},_COMMIT_SHA=${REMOTE_SHA}"

echo "==> Step 2/4: Uploading manifest to GCS to trigger OSS Exit Gate release..."
MANIFEST_FILE="${TEMP_DIR}/publish_manifest.json"

if [[ "${NPM_TAG}" == "latest" ]]; then
  cat <<'EOF' > "${MANIFEST_FILE}"
{
  "publish_all": true
}
EOF
else
  cat <<EOF > "${MANIFEST_FILE}"
{
  "publish_all": true,
  "registry_config": {
    "npm": {
      "tags": ["${NPM_TAG}"]
    }
  }
}
EOF
fi

echo "Generated OSS Exit Gate manifest:"
cat "${MANIFEST_FILE}"

gcloud storage cp \
  --impersonate-service-account="${BUILDER_SA}" \
  --billing-project=LEGACY \
  "${MANIFEST_FILE}" \
  "${EXIT_GATE_GCS_MANIFEST}"
echo "==> Manifest uploaded to ${EXIT_GATE_GCS_MANIFEST}; OSS Exit Gate release triggered."

echo "==> Step 3/4: Waiting for superstatic@${NEW_VERSION} to propagate to https://registry.npmjs.org ..."
TIMEOUT=1200
ELAPSED=0
INTERVAL=15
until [[ "$(npm view "superstatic@${NEW_VERSION}" version --registry=https://registry.npmjs.org 2>/dev/null)" == "${NEW_VERSION}" ]]; do
  if [[ ${ELAPSED} -ge ${TIMEOUT} ]]; then
    echo "Error: Timed out after ${ELAPSED}s waiting for superstatic@${NEW_VERSION} on npm." >&2
    echo "Check the OSS Exit Gate notification emails to firebase-hosting-team@google.com for pipeline logs." >&2
    exit 1
  fi
  echo "Still waiting for superstatic@${NEW_VERSION}... (${ELAPSED}s/${TIMEOUT}s)"
  sleep "${INTERVAL}"
  ELAPSED=$((ELAPSED + INTERVAL))
done
echo "==> Confirmed: superstatic@${NEW_VERSION} is live on npm!"

if [[ "${VERSION}" == "preview" ]]; then
  echo "==> Preview release complete! Install with: npm i -g superstatic@preview (or superstatic@${NEW_VERSION})"
  exit 0
fi

echo "==> Step 4/4: Committing version bump, tagging, resetting ${CHANGELOG_FILE}, and creating draft GitHub release..."
RELEASE_NOTES_FILE="${TEMP_DIR}/release_notes.txt"
{
  echo "v${NEW_VERSION}"
  echo ""
  cat "${CHANGELOG_FILE}"
} > "${RELEASE_NOTES_FILE}"

# Apply the version bump to package.json & package-lock.json and tag v${NEW_VERSION}
npm version "${NEW_VERSION}" --no-git-tag-version >/dev/null
git add package.json package-lock.json
git commit -m "chore(release): v${NEW_VERSION}"
git tag -a "v${NEW_VERSION}" -m "v${NEW_VERSION}"

# Reset changelog.txt after tagging (matching firebase-tools convention)
: > "${CHANGELOG_FILE}"
git add "${CHANGELOG_FILE}"
git commit -m "[firebase-release] Removed change log and reset repo after ${NEW_VERSION} release"

echo "==> Pushing commits and tag v${NEW_VERSION} to origin/main..."
git push origin main "v${NEW_VERSION}"

echo "==> Creating draft GitHub release v${NEW_VERSION}..."
gh release create "v${NEW_VERSION}" \
  --repo firebase/superstatic \
  --draft \
  --title "v${NEW_VERSION}" \
  --notes-file "${RELEASE_NOTES_FILE}"

echo "==> Done! Review and publish the draft GitHub release at:"
echo "    https://github.com/firebase/superstatic/releases"
