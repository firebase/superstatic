/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var url = require('fast-url-parser');
var pathutils = require('../utils/pathutils');
var _ = require('lodash');

// We cannot redirect to "", redirect to "/" instead
function normalizeRedirectPath(path) {
  return path || '/';
}

module.exports = function() {
  return function(req, res, next) {
    var config = req.superstatic;
    var trailingSlashBehavior = config.trailingSlash;

    var parsedUrl = url.parse(req.url);
    var pathname = pathutils.normalizeMultiSlashes(parsedUrl.pathname);
    var search = parsedUrl.search || '';

    var cleanUrlRules = !!_.get(req, 'superstatic.cleanUrls');

    // Exact file always wins.
    return res.superstatic.provider(req, pathname).then(function(result) {
      if (result) {
        // If we are using cleanURLs, we'll trim off any `.html` (or `/index.html`), if it exists.
        if (cleanUrlRules) {
          if (_.endsWith(pathname, '.html')) {
            var redirPath = pathutils.removeTrailingString(pathname, '.html');
            if (_.endsWith(redirPath, '/index')) {
              redirPath = pathutils.removeTrailingString(redirPath, '/index');
            }
            // But if we need to keep the trailing slashes, we will do so.
            if (trailingSlashBehavior === true) {
              redirPath = pathutils.addTrailingSlash(redirPath);
            }
            return res.superstatic.handle({redirect: normalizeRedirectPath(redirPath + search)});
          }
        }
        return res.superstatic.handleFileStream({file: pathname}, result);
      }

      // Now, let's consider the trailing slash.
      var hasTrailingSlash = pathutils.hasTrailingSlash(pathname);

      // We want to check for some other files, namely an `index.html` if this were a directory.
      var pathAsDirectoryWithIndex = pathutils.asDirectoryIndex(pathutils.addTrailingSlash(pathname));
      return res.superstatic.provider(req, pathAsDirectoryWithIndex).then(function(pathAsDirectoryWithIndexResult) {
        // If an exact file wins now, we know that this path leads us to a directory.
        if (pathAsDirectoryWithIndexResult) {
          if (trailingSlashBehavior === undefined &&
              !hasTrailingSlash &&
              !cleanUrlRules) {
            return res.superstatic.handle({redirect: pathutils.addTrailingSlash(pathname) + search});
          }
          if (trailingSlashBehavior === false &&
              hasTrailingSlash &&
              pathname !== '/') { // No infinite redirects
            return res.superstatic.handle({redirect: normalizeRedirectPath(pathutils.removeTrailingSlash(pathname) + search)});
          }
          if (trailingSlashBehavior === true &&
              !hasTrailingSlash) {
            return res.superstatic.handle({redirect: pathutils.addTrailingSlash(pathname) + search});
          }
          // If we haven't returned yet, our path is "correct" and we should be serving a file, not redirecting.
          return res.superstatic.handleFileStream({file: pathAsDirectoryWithIndex}, pathAsDirectoryWithIndexResult);
        }

        // Let's check on the clean URLs property.
        // We want to know if a specific mutation of the path exists.
        if (cleanUrlRules) {
          var appendedPath = pathname;
          if (hasTrailingSlash) {
            if (trailingSlashBehavior !== undefined) {
              // We want to remove the trailing slash and see if a file exists with an .html attached.
              appendedPath = pathutils.removeTrailingString(pathname, '/') + '.html';
            }
          } else {
            // Let's see if our path is a simple clean URL missing a .HTML5
            appendedPath += '.html';
          }

          return res.superstatic.provider(req, appendedPath).then(function(appendedPathResult) {
            if (appendedPathResult) {
              // Okay, back to trailing slash behavior
              if (trailingSlashBehavior === false &&
                  hasTrailingSlash) {
                // If we had a slash to begin with, and we could be serving a file without it, we'll remove the slash.
                // (This works because we are in the cleanURL block.)
                return res.superstatic.handle({redirect: normalizeRedirectPath(pathutils.removeTrailingSlash(pathname) + search)});
              }
              if (trailingSlashBehavior === true &&
                  !hasTrailingSlash) {
                // If we are missing a slash and need to add it, we want to make sure our appended path is cleaned up.
                appendedPath = pathutils.removeTrailingString(appendedPath, '.html');
                appendedPath = pathutils.removeTrailingString(appendedPath, '/index');
                return res.superstatic.handle({redirect: pathutils.addTrailingSlash(appendedPath) + search});
              }
              // If we've gotten this far and still have `/index.html` on the end, we want to remove it from the URL.
              if (_.endsWith(appendedPath, '/index.html')) {
                return res.superstatic.handle({redirect: normalizeRedirectPath(pathutils.removeTrailingString(appendedPath, '/index.html') + search)});
              }
              // And if we should be serving a file and we're at the right path, we'll serve the file.
              return res.superstatic.handleFileStream({file: appendedPath}, appendedPathResult);
            }

            return next();
          });
        }

        return next();
      });
    }).catch(function(err) {
      res.superstatic.handleError(err);
    });
  };
};
