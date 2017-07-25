/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var url = require('fast-url-parser');
var pathutils = require('../utils/pathutils');

module.exports = function() {
  return function(req, res, next) {
    var config = req.superstatic;
    var configTrailingSlash = config.trailingSlash;

    var parsedUrl = url.parse(req.url);
    var pathname = pathutils.normalizeMultiSlashes(parsedUrl.pathname);
    var search = parsedUrl.search || '';

    if (pathname === '/') {
      pathname = '/index.html';
    }

    var indexPathname = pathutils.asDirectoryIndex(pathname);

    var hasTrailingSlash = pathutils.hasTrailingSlash(pathname);
    var withTrailingSlash = pathutils.addTrailingSlash(pathname) + search;
    var withoutTrailingSlash = pathutils.removeTrailingSlash(pathname) + search;

    if (hasTrailingSlash && configTrailingSlash === false) {
      return res.superstatic.handle({redirect: withoutTrailingSlash});
    } else if (!hasTrailingSlash && configTrailingSlash === true) {
      return res.superstatic.handle({redirect: withTrailingSlash});
    }

    var fetchPath = hasTrailingSlash ? indexPathname : pathname;
    var fallbackPath = hasTrailingSlash ? pathname : indexPathname;
    var noresultRedirect = hasTrailingSlash ? withoutTrailingSlash : withTrailingSlash;

    return res.superstatic.provider(req, fetchPath).then(function(result) {
      if (result) {
        return res.superstatic.handleFileStream({file: fetchPath}, result);
      }

      return res.superstatic.provider(req, fallbackPath).then(function(fallbackResult) {
        if (fallbackResult) {
          return res.superstatic.handle({redirect: noresultRedirect});
        }

        return next();
      });
    }).catch(function(err) {
      res.superstatic.handleError(err);
    });
  };
};
