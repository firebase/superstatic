/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const _ = require("lodash");
const pathjoin = require("join-path");
const pathutils = require("../utils/pathutils");
const url = require("fast-url-parser");

/**
 * We cannot redirect to "", redirect to "/" instead.
 * @param {string} path path
 * @return {string} noramlized path
 */
function normalizeRedirectPath(path) {
  return path || "/";
}

module.exports = function() {
  return function(req, res, next) {
    const config = req.superstatic;
    const trailingSlashBehavior = config.trailingSlash;

    const parsedUrl = url.parse(req.url);
    const pathname = pathutils.normalizeMultiSlashes(parsedUrl.pathname);
    const search = parsedUrl.search || "";

    const cleanUrlRules = !!_.get(req, "superstatic.cleanUrls");

    // Exact file always wins.
    return providerResult(req, res, pathname)
      .then((result) => {
        if (result) {
          // If we are using cleanURLs, we'll trim off any `.html` (or `/index.html`), if it exists.
          if (cleanUrlRules) {
            if (_.endsWith(pathname, ".html")) {
              let redirPath = pathutils.removeTrailingString(pathname, ".html");
              if (_.endsWith(redirPath, "/index")) {
                redirPath = pathutils.removeTrailingString(redirPath, "/index");
              }
              if (trailingSlashBehavior === true) {
                redirPath = pathutils.addTrailingSlash(redirPath);
              }
              return res.superstatic.handle({
                redirect: normalizeRedirectPath(redirPath + search)
              });
            }
          }
          return res.superstatic.handleFileStream({ file: pathname }, result);
        }

        // Now, let's consider the trailing slash.
        const hasTrailingSlash = pathutils.hasTrailingSlash(pathname);

        // We want to check for some other files, namely an `index.html` if this were a directory.
        const pathAsDirectoryWithIndex = pathutils.asDirectoryIndex(
          pathutils.addTrailingSlash(pathname)
        );
        return providerResult(req, res, pathAsDirectoryWithIndex).then(
          (pathAsDirectoryWithIndexResult) => {
            // If an exact file wins now, we know that this path leads us to a directory.
            if (pathAsDirectoryWithIndexResult) {
              if (
                trailingSlashBehavior === undefined &&
                !hasTrailingSlash &&
                !cleanUrlRules
              ) {
                return res.superstatic.handle({
                  redirect: pathutils.addTrailingSlash(pathname) + search
                });
              }
              if (
                trailingSlashBehavior === false &&
                hasTrailingSlash &&
                pathname !== "/"
              ) {
                // No infinite redirects
                return res.superstatic.handle({
                  redirect: normalizeRedirectPath(
                    pathutils.removeTrailingSlash(pathname) + search
                  )
                });
              }
              if (trailingSlashBehavior === true && !hasTrailingSlash) {
                return res.superstatic.handle({
                  redirect: pathutils.addTrailingSlash(pathname) + search
                });
              }
              // If we haven't returned yet, our path is "correct" and we should be serving a file, not redirecting.
              return res.superstatic.handleFileStream(
                { file: pathAsDirectoryWithIndex },
                pathAsDirectoryWithIndexResult
              );
            }

            // Let's check on the clean URLs property.
            // We want to know if a specific mutation of the path exists.
            if (cleanUrlRules) {
              let appendedPath = pathname;
              if (hasTrailingSlash) {
                if (trailingSlashBehavior !== undefined) {
                  // We want to remove the trailing slash and see if a file exists with an .html attached.
                  appendedPath =
                    pathutils.removeTrailingString(pathname, "/") + ".html";
                }
              } else {
                // Let's see if our path is a simple clean URL missing a .HTML5
                appendedPath += ".html";
              }

              return providerResult(req, res, appendedPath).then(
                (appendedPathResult) => {
                  if (appendedPathResult) {
                    // Okay, back to trailing slash behavior
                    if (trailingSlashBehavior === false && hasTrailingSlash) {
                      // If we had a slash to begin with, and we could be serving a file without it, we'll remove the slash.
                      // (This works because we are in the cleanURL block.)
                      return res.superstatic.handle({
                        redirect: normalizeRedirectPath(
                          pathutils.removeTrailingSlash(pathname) + search
                        )
                      });
                    }
                    if (trailingSlashBehavior === true && !hasTrailingSlash) {
                      // If we are missing a slash and need to add it, we want to make sure our appended path is cleaned up.
                      appendedPath = pathutils.removeTrailingString(
                        appendedPath,
                        ".html"
                      );
                      appendedPath = pathutils.removeTrailingString(
                        appendedPath,
                        "/index"
                      );
                      return res.superstatic.handle({
                        redirect:
                          pathutils.addTrailingSlash(appendedPath) + search
                      });
                    }
                    // If we've gotten this far and still have `/index.html` on the end, we want to remove it from the URL.
                    if (_.endsWith(appendedPath, "/index.html")) {
                      return res.superstatic.handle({
                        redirect: normalizeRedirectPath(
                          pathutils.removeTrailingString(
                            appendedPath,
                            "/index.html"
                          ) + search
                        )
                      });
                    }
                    // And if we should be serving a file and we're at the right path, we'll serve the file.
                    return res.superstatic.handleFileStream(
                      { file: appendedPath },
                      appendedPathResult
                    );
                  }

                  return next();
                }
              );
            }

            return next();
          }
        );
      })
      .catch((err) => {
        res.superstatic.handleError(err);
      });
  };
};

/**
 * Uses the provider to look for a file given a path.
 * This also takes into account i18n settings.
 * @param {*} req
 * @param {*} res
 * @param {string} p the path to search for.
 * @return {Promise<*>} a non-null value if a file is found.
 */
function providerResult(req, res, p) {
  return Promise.resolve()
    .then(() => {
      const promises = [];

      const i18n = req.superstatic.i18n;
      if (i18n && i18n.root) {
        // The path order is:
        // (1) root/language_country/path (for each language)
        // (2) root/ALL_country/path (if country is set)
        // (3) root/language_ALL/path or root/language/path (for each language)
        const country = getCountryCode(req.headers);
        const languages = getI18nLanguages(req.headers);
        // (1)
        if (country) {
          for (const l of languages) {
            promises.push(
              res.superstatic.provider(
                req,
                pathjoin(i18n.root, `${l}_${country}`, p)
              )
            );
          }
          // (2)
          promises.push(
            res.superstatic.provider(
              req,
              pathjoin(i18n.root, `ALL_${country}`, p)
            )
          );
        }
        // (3)
        for (const l of languages) {
          promises.push(
            res.superstatic.provider(req, pathjoin(i18n.root, `${l}_ALL`, p))
          );
          promises.push(
            res.superstatic.provider(req, pathjoin(i18n.root, `${l}`, p))
          );
        }
      }

      promises.push(res.superstatic.provider(req, p));
      return Promise.all(promises);
    })
    .then((results) => {
      for (const r of results) {
        if (r) {
          return r;
        }
      }
    });
}

/**
 * Fetches the country code from the headers object.
 * @param {object} headers
 * @return {string} country code, or an empty string.
 */
function getCountryCode(headers) {
  const overrideValue = cookieValue(
    headers.cookie,
    "firebase-country-override"
  );
  if (overrideValue) {
    return overrideValue;
  }
  return headers["x-country-code"] || "";
}

/**
 * Fetches the languages from the accept-language header.
 * @param {object} headers
 * @return {Array<string>} ordered list of languages from the header.
 */
function getI18nLanguages(headers) {
  const overrideValue = cookieValue(
    headers.cookie,
    "firebase-language-override"
  );
  if (overrideValue) {
    return overrideValue.includes(",")
      ? overrideValue.split(",")
      : [overrideValue];
  }

  const acceptLanguage = headers["accept-language"];
  if (!acceptLanguage) {
    return [];
  }

  const languagesSeen = {};
  const languagesOrdered = [];
  for (const v of acceptLanguage.split(",")) {
    const l = v.split("-")[0];
    if (!l) {
      continue;
    }
    if (!languagesSeen[l]) {
      languagesOrdered.push(l);
    }
    languagesSeen[l] = true;
  }
  return languagesOrdered;
}

/**
 * Fetches a value from a cookie string.
 * @param {string|undefined} cookieString full cookie string.
 * @param {string} key key to look for.
 * @return {string} the value.
 */
function cookieValue(cookieString, key) {
  if (!cookieString) {
    return "";
  }
  const cookies = cookieString.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(key)) {
      const s = cookie.split("=", 2);
      return s.length === 2 ? s[1] : "";
    }
  }
  return "";
}
