/**
 * Copyright (c) 2022 Google LLC
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

const _ = require("lodash");
const { i18nContentOptions } = require("../utils/i18n");
const pathutils = require("../utils/pathutils");
const url = require("url");

/**
 * We cannot redirect to "", redirect to "/" instead.
 * @param {string} path path
 * @returns {string} noramlized path
 */
function normalizeRedirectPath(path) {
  return path || "/";
}

module.exports = function () {
  return function (req, res, next) {
    const config = req.superstatic;
    const trailingSlashBehavior = config.trailingSlash;

    const parsedUrl = url.parse(req.url);
    const pathname = pathutils.normalizeMultiSlashes(parsedUrl.pathname);
    const search = parsedUrl.search ?? "";

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
                redirect: normalizeRedirectPath(redirPath + search),
              });
            }
          }
          return res.superstatic.handleFileStream({ file: pathname }, result);
        }

        // Now, let's consider the trailing slash.
        const hasTrailingSlash = pathutils.hasTrailingSlash(pathname);

        // We want to check for some other files, namely an `index.html` if this were a directory.
        const pathAsDirectoryWithIndex = pathutils.asDirectoryIndex(
          pathutils.addTrailingSlash(pathname),
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
                  redirect: pathutils.addTrailingSlash(pathname) + search,
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
                    pathutils.removeTrailingSlash(pathname) + search,
                  ),
                });
              }
              if (trailingSlashBehavior === true && !hasTrailingSlash) {
                return res.superstatic.handle({
                  redirect: pathutils.addTrailingSlash(pathname) + search,
                });
              }
              // If we haven't returned yet, our path is "correct" and we should be serving a file, not redirecting.
              return res.superstatic.handleFileStream(
                { file: pathAsDirectoryWithIndex },
                pathAsDirectoryWithIndexResult,
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
                          pathutils.removeTrailingSlash(pathname) + search,
                        ),
                      });
                    }
                    if (trailingSlashBehavior === true && !hasTrailingSlash) {
                      // If we are missing a slash and need to add it, we want to make sure our appended path is cleaned up.
                      appendedPath = pathutils.removeTrailingString(
                        appendedPath,
                        ".html",
                      );
                      appendedPath = pathutils.removeTrailingString(
                        appendedPath,
                        "/index",
                      );
                      return res.superstatic.handle({
                        redirect:
                          pathutils.addTrailingSlash(appendedPath) + search,
                      });
                    }
                    // If we've gotten this far and still have `/index.html` on the end, we want to remove it from the URL.
                    if (_.endsWith(appendedPath, "/index.html")) {
                      return res.superstatic.handle({
                        redirect: normalizeRedirectPath(
                          pathutils.removeTrailingString(
                            appendedPath,
                            "/index.html",
                          ) + search,
                        ),
                      });
                    }
                    // And if we should be serving a file and we're at the right path, we'll serve the file.
                    return res.superstatic.handleFileStream(
                      { file: appendedPath },
                      appendedPathResult,
                    );
                  }

                  return next();
                },
              );
            }

            return next();
          },
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
 * @param {*} req the Request.
 * @param {*} res the Response.
 * @param {string} p the path to search for.
 * @returns {Promise<*>} a non-null value if a file is found.
 */
function providerResult(req, res, p) {
  const promises = [];

  const i18n = req.superstatic.i18n;
  if (i18n?.root) {
    const paths = i18nContentOptions(p, req);
    for (const pth of paths) {
      promises.push(res.superstatic.provider(req, pth));
    }
  }
  promises.push(res.superstatic.provider(req, p));

  return Promise.all(promises).then((results) => {
    for (const r of results) {
      if (r) {
        return r;
      }
    }
  });
}
