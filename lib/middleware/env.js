/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var fs = require('fs');
var template = fs.readFileSync(__dirname + '/../assets/env.js.template').toString();
var mime = require('mime-types');
var _ = require('lodash');

module.exports = function(spec) {
  return function(req, res, next) {
    var config = _.get(req, 'superstatic.env');
    var env;
    if (spec.env || config) {
      env = _.assign({}, config, spec.env);
    } else {
      return next();
    }

    if (req.url === '/__/env.json') {
      res.superstatic.handleData({data: JSON.stringify(env, null, 2), contentType: mime.contentType('json')});
      return undefined;
    } else if (req.url === '/__/env.js') {
      var payload = template.replace('{{ENV}}', JSON.stringify(env));
      res.superstatic.handleData({data: payload, contentType: mime.contentType('js')});
      return undefined;
    }

    next();
  };
};
