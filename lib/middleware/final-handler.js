/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var send = require('send');
var setCacheHeader = require('cache-header');

var EXPIRES = 60 * 60 * 24 * 30 * 6; // 6 months(ish)

module.exports = function (imports) {
  
  var file = imports.file;
  
  return function (err, req, res, next) {
    
    var status = err.status || 404;
    send(req, file)
      .on('headers', function () {
      
        res.__.status(status);
        setCacheHeader(res, EXPIRES);
      })
      .on('error', function (err) {
        
        res
          .__.status(status)
          .__.send('Not Found');
      })
      .pipe(res);
  };
};