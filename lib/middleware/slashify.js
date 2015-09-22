/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var qs = require('qs');
var url = require('fast-url-parser');
var join = require('join-path');
var query = require('connect-query');

module.exports = function (imports) {

  var provider = imports.provider;
  var config = imports.config || {};

  return function (req, res, next) {
    var pathname = url.parse(req.url).pathname;

    query()(req, res, function (err) {

      if (err) {
        return next(err);
      }

      isDirectory(function(isDir) {
        isDirectoryIndex(function(isDirIndex) {
          if (isDir && !isDirIndex) {
            return next();
          }

          fileExists(function(fExist) {
            var hasTrailSlash = hasTrailingSlash();

            // Force trailing slash
            if (config.trailing_slash === true && !hasTrailSlash && !fExist) {
              return redirectWithSlash(pathname);
            }

            if (config.trailing_slash === false && hasTrailSlash) {
              return redirectWithoutSlash(pathname);
            }

            // Add a slash to a path that represtents a directory index
            if (isDirIndex && !hasTrailSlash) {
              return redirectWithSlash(pathname);
            }

            // Skip if this is a directory index path
            if (isDirIndex) {
              return next();
            }

            // Handle paths that don't need a strailing slash
            if (pathname !== '/' && hasTrailSlash) {
              return redirectWithoutSlash(pathname);
            }

            // No redirect needed
            next();
          });
        });
      });
    });

    function redirect (redirectUrl) {

      var query = qs.stringify(req.query);
      redirectUrl += (query) ? '?' + query : '';
      res.__.redirect(redirectUrl);
    }

    function isDirectory (callback) {

      fileExists(function(exist) {
        if (exist) {
          provider.isDirectory(urlNoQuery(), callback);
        } else {
          callback(false);
        }
      });
    }

    function fileExists (callback) {

      provider.exists(urlNoQuery(), callback);
    }

    function isDirectoryIndex (callback) {

      return provider.isDirectoryIndex(urlNoQuery(), callback);
    }

    function hasTrailingSlash () {

      return pathname.substr(-1) === '/';
    }

    function urlNoQuery () {

      return req.url.split('?')[0];
    }

    function redirectWithoutSlash (pathanme) {

      return redirect(pathname.substring(0, pathname.length - 1));
    }

    function redirectWithSlash (pathname) {

      return redirect(join(pathname, '/'));
    }
  };
};
