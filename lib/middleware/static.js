/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


module.exports = function (config) {
  config = config || {};
  return function (req, res, next) {
    res.__.sendFile(req._parsedUrl.pathname)
      .on('headers', function() {
        if (req._parsedUrl.pathname === config.error_page) {
          res.__.status(404);
        }
      }).on('error', function (err) {
        if (err.status) { res.statusCode = err.status; }
        next();
      });
  };
};
