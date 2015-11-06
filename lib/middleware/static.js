/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var url = require('fast-url-parser');
var pathutils = require('../utils/pathutils');

module.exports = function(config) {
  config = config || {};
  var configTrailingSlash = config.trailingSlash;

  return function(req, res, next) {
    var parsedUrl = url.parse(req.url);
    var pathname = parsedUrl.pathname;
    var search = parsedUrl.search || '';

    if (pathname === '/') {
      pathname = '/index.html';
    }

    var indexPathname = pathutils.asDirectoryIndex(pathname);

    var hasTrailingSlash = pathutils.hasTrailingSlash(pathname);
    var withTrailingSlash = pathutils.addTrailingSlash(pathname) + search;
    var withoutTrailingSlash = pathutils.removeTrailingSlash(pathname) + search;

    res._responder.provider(req, pathname).then(function(result) {
      if (result) {
        return res._responder.handleFileStream({file: pathname}, result);
      } else if (hasTrailingSlash && configTrailingSlash === false) {
        return res._responder.handle({redirect: withoutTrailingSlash});
      } else if (!hasTrailingSlash && configTrailingSlash === true) {
        return res._responder.handle({redirect: withTrailingSlash});
      }

      return res._responder.provider(req, indexPathname).then(function(indexResult) {
        if (indexResult && hasTrailingSlash) {
          return res._responder.handleFileStream({file: indexPathname}, indexResult);
        } else if (indexResult && !hasTrailingSlash) {
          return res._responder.handle({redirect: withTrailingSlash});
        }

        next();
      });
    }).catch(function(err) {
      res._responder.handleError(err);
    });
  };
};
