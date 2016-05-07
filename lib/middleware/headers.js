/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var _ = require('lodash');
var slasher = require('glob-slasher');
var urlParser = require('fast-url-parser');
var onHeaders = require('on-headers');
var minimatch = require('minimatch');

var normalizedConfigHeaders = function(spec, config) {
  var out = config || [];
  if (_.isArray(config)) {
    var _isAllowed = function(headerToSet) {
      return _.includes(spec.allowedHeaders, headerToSet.key.toLowerCase());
    };

    for (var i = 0; i < config.length; i++) {
      config[i].source = slasher(config[i].source);
      config[i].headers = config[i].headers || [];
      if (spec.allowedHeaders) {
        config[i].headers = config[i].headers.filter(_isAllowed);
      }
    }
  }

  return out;
};

var matcher = function(configHeaders) {
  return function(url) {
    return configHeaders.filter(function(configHeader) {
      return minimatch(url, configHeader.source);
    }).reduce(function(out, val) {
      val.headers.forEach(function(headerToSet) {
        out.push(headerToSet);
      });
      return out;
    }, []);
  };
};

module.exports = function(spec) {
  return function(req, res, next) {
    var config = _.get(req, 'superstatic.headers');
    if (!config) {
      return next();
    }

    var headers = matcher(normalizedConfigHeaders(spec, config));
    var pathname = urlParser.parse(req.url).pathname;
    var matches = headers(slasher(pathname));

    onHeaders(res, function() {
      _.forEach(matches, function(header) {
        res.setHeader(header.key, header.value);
      });
    });

    return next();
  };
};
