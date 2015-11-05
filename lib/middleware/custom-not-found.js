/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var setCacheHeader = require('cache-header');
var setHeaders = require('./set-headers');

module.exports = function(config) {
  config = config || {};

  return function(req, res, next) {
    setHeaders(config.headers)({url: config.errorPage}, res, function() {
      res._responder.handle({file: config.errorPage, status: 404}, next);
    });
  };
};
