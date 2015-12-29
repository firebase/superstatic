/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var slasher = require('glob-slasher');
var minimatch = require('minimatch');
var urlParser = require('fast-url-parser');

var normalizeConfig = function(config) {
  return config || [];
};

var matcher = function(rewrites) {
  return function(url) {
    for (var i = 0; i < rewrites.length; i++) {
      if (minimatch(url, rewrites[i].source)) {
        return rewrites[i].destination;
      }
    }
  };
};

module.exports = function() {
  return function(req, res, next) {
    var rewrites = matcher(normalizeConfig(req.superstatic.rewrites));

    var pathname = urlParser.parse(req.url).pathname;
    var filepath = rewrites(slasher(pathname));

    if (!filepath) {
      return next();
    }

    res.statusCode = 200;
    res.superstatic.handle(filepath, next);
  };
};
