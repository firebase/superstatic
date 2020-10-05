/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const _ = require("lodash");
const slasher = require("glob-slasher");
const urlParser = require("fast-url-parser");
const onHeaders = require("on-headers");
const patterns = require("../utils/patterns");

const normalizedConfigHeaders = function(spec, config) {
  const out = config || [];
  if (_.isArray(config)) {
    const _isAllowed = function(headerToSet) {
      return _.includes(spec.allowedHeaders, headerToSet.key.toLowerCase());
    };

    for (let i = 0; i < config.length; i++) {
      config[i].source = slasher(config[i].source);
      config[i].headers = config[i].headers || [];
      if (spec.allowedHeaders) {
        config[i].headers = config[i].headers.filter(_isAllowed);
      }
    }
  }

  return out;
};

const matcher = function(configHeaders) {
  return function(url) {
    return configHeaders
      .filter((configHeader) => {
        return patterns.configMatcher(url, configHeader);
      })
      .reduce((out, val) => {
        val.headers.forEach((headerToSet) => {
          out.push(headerToSet);
        });
        return out;
      }, []);
  };
};

module.exports = function(spec) {
  return function(req, res, next) {
    const config = _.get(req, "superstatic.headers");
    if (!config) {
      return next();
    }

    const headers = matcher(normalizedConfigHeaders(spec, config));
    const pathname = urlParser.parse(req.url).pathname;
    const matches = headers(slasher(pathname));

    onHeaders(res, () => {
      _.forEach(matches, (header) => {
        res.setHeader(header.key, header.value);
      });
    });

    return next();
  };
};
