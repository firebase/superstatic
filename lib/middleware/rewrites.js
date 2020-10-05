/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const slasher = require("glob-slasher");
const urlParser = require("fast-url-parser");
const patterns = require("../utils/patterns");

const normalizeConfig = function(config) {
  return config || [];
};

const matcher = function(rewrites) {
  return function(url) {
    for (let i = 0; i < rewrites.length; i++) {
      if (patterns.configMatcher(url, rewrites[i])) {
        return rewrites[i];
      }
    }
    return undefined;
  };
};

module.exports = function() {
  return function(req, res, next) {
    const rewrites = matcher(normalizeConfig(req.superstatic.rewrites));

    const pathname = urlParser.parse(req.url).pathname;
    const match = rewrites(slasher(pathname));

    if (!match) {
      return next();
    }

    res.statusCode = 200;

    return res.superstatic.handle({ rewrite: match }, next);
  };
};
