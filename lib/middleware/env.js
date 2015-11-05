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

module.exports = function(options) {
  var envData = options.data || {};
  return function(req, res, next) {
    if (req.url === '/__/env.json') {
      res._responder.handleData({data: JSON.stringify(envData, null, 2), contentType: mime.contentType('json')});
      return;
    } else if (req.url === '/__/env.js') {
      var payload = template.replace("{{ENV}}", JSON.stringify(envData));
      res._responder.handleData({data: payload, contentType: mime.contentType('js')});
      return;
    }

    next();
  };
};
