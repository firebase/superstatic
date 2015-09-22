/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var _ = require('lodash');
var slasher = require('glob-slasher');
var url = require('fast-url-parser');
var onHeaders = require('on-headers');
var minimatch = require('minimatch');

var normalizeConfig = function(config) {
  var out = config;
  if (_.isPlainObject(config)) {
    out = [];
    for (var source in config) {
      var item = {source: slasher(source), headers: []};
      for (var key in config[source]) {
        item.headers.push({
          key: key,
          value: config[source][key]
        });
      }
      out.push(item);
    }
  } else if (_.isArray(config)) {
    for (var i = 0; i < config.length; i++) {
      config[i].source = slasher(config[i].source);
    }
  } else {
    out = [];
  }

  return out;
};

var matcher = function(config, options) {
  var whitelist;
  if (options && options.whitelist) {
     whitelist = options.whitelist.map(function(name) {
      return name.toLowerCase();
    });
  }

  return function(url) {
    var toApply = [];

    var checkWhitelist = function(header) {
      if (!whitelist || whitelist.indexOf(header.key.toLowerCase()) >= 0) {
        toApply.push(header);
      }
    };

    for (var i = 0; i < config.length; i++) {
      if (minimatch(url, config[i].source)) {
        _.forEach(config[i].headers, checkWhitelist);
      }
    }

    return toApply;
  };
};

module.exports = function (headerPaths, options) {
  var headers = matcher(normalizeConfig(headerPaths), options);

  return function (req, res, next) {
    var pathname = url.parse(req.url).pathname;
    var matches = headers(slasher(pathname));

    onHeaders(res, function () {
      _.forEach(matches, function (header) {
        res.setHeader(header.key, header.value);
      });
    });

    return next();
  };
};
