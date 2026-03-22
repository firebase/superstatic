/**
 * Copyright (c) 2026 Google LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import * as path from "path";

/**
 * Adds a leading slash to a glob pattern and normalizes it using POSIX path
 * separators. Handles negated globs (e.g. `!src` → `!/src`).
 * Uses path.posix to ensure forward slashes on all platforms, including Windows.
 * @param spec glob pattern to normalize
 * @returns normalized glob pattern with a leading slash
 */
export function slasher(
  spec: string | null | undefined,
): string | null | undefined {
  if (!spec) {
    return spec;
  }

  if (spec.startsWith("!")) {
    return "!" + path.posix.normalize(path.posix.join("/", spec.slice(1)));
  }

  return path.posix.normalize(path.posix.join("/", spec));
}
