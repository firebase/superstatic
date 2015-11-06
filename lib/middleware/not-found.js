/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var fs = require('fs');

module.exports = function(imports) {
  var content = fs.readFileSync(imports.file);

  return function(req, res) {
    // NOTE: provider isn't used to serve the pages
    // because this middleware should only serve local
    // static pages around the same directory as the
    // superstatic middleware

    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.end(content);
  };
};
