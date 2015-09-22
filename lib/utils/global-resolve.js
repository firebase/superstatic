/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var glob = require('glob');
var tryRequire = require('try-require');
var join = require('join-path');

var npmPaths = require('./npm-paths');

module.exports = function globalResolve (name) {
  
  var servicePath;
  
  npmPaths()
    .forEach(function (root) {
    
      if (!servicePath) {
        var filepath = glob.sync(join(root, name))[0];
        servicePath = tryRequire(filepath);
      }
    });
  
  return servicePath;
};