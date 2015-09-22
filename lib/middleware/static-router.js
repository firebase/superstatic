/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var slasher = require('glob-slasher');
var minimatch = require('minimatch');
var url = require('fast-url-parser');
var flattenToObject = require('flatten-to-object');
var path = require('path');
var _ = require('lodash');

var normalizeConfig = function(config) {
  if (!config) return [];
  if (!_.isArray(config)){ config = [config]; }
  var out;
  if (config.length === 0 || config[0].source && config[0].destination) {
    out = config.map(function(route) {
      return {
        source: slasher(route.source),
        destination: slasher(route.destination)
      };
    });
  } else {
    out = [];
    for (var i = 0; i < config.length; i++) {
      for (var source in config[i]) {
        out.push({
          source: slasher(source),
          destination: slasher(config[i][source])
        });
      }
    }
  }

  return out;
};

var matcher = function(rewrites) {
  return function(url) {
    for (var i = 0; i < rewrites.length; i++) {
      if (minimatch(url,rewrites[i].source)) {
        return rewrites[i].destination;
      }
    }
  };
};

module.exports = function (imports) {
  var rewrites = matcher(normalizeConfig(imports.rewrites));

  return function (req, res, next) {

    var pathname = url.parse(req.url).pathname;
    var filepath = rewrites(slasher(pathname));

    if (!filepath) {
      return next();
    }

    var ext = path.extname(pathname);
    if (ext && ext !== path.extname(filepath)) {
      return next();
    }

    res.statusCode = 200;
    res.__.sendFile(filepath)
      .on('error', function () {

        next();
      });
  };
};
