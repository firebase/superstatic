/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var setCacheHeader = require('cache-header');
var setHeaders = require('./set-headers');

module.exports = function (config) {
  config = config || {};

  return function (req, res, next) {
    setHeaders(config.headers)({url: config.error_page}, res, function() {
      res
        .__.sendFile(config.error_page)
        .on('headers', function () {
          res.__.status(404);
        }).on('error', function (err) {
          next();
        });
    });
  };
};
