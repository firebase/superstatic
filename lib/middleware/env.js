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

module.exports = function(spec, config) {
  return function(req, res, next) {
    var env;
    if (spec.env || config.env) {
      env = _.assign({}, config.env, spec.env);
    } else {
      return next();
    }

    if (req.url === '/__/env.json') {
      res._responder.handleData({data: JSON.stringify(env, null, 2), contentType: mime.contentType('json')});
      return undefined;
    } else if (req.url === '/__/env.js') {
      var payload = template.replace('{{ENV}}', JSON.stringify(env));
      res._responder.handleData({data: payload, contentType: mime.contentType('js')});
      return undefined;
    }

    next();
  };
};
