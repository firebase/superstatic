/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var compact = require('lodash').compact;
var path = require('path');
var homeDir = require('home-dir');

var win32 = process.platform === 'win32';

module.exports = function npmPaths () {
  var paths = [];

  // Walk up the CWD and add `node_modules/` folder lookup on each level
  process.cwd().split(path.sep).forEach(function (part, i, parts) {
    var lookup = path.join.apply(path, parts.slice(0, i + 1).concat(['node_modules']));

    if (!win32) {
      lookup = '/' + lookup;
    }

    paths.push(lookup);
  });

  // Adding global npm directories
  // We tried using npm to get the global modules path, but it haven't work out
  // because of bugs in the parseable implementation of `ls` command and mostly
  // performance issues. So, we go with our best bet for now.
  if (process.env.NODE_PATH) {
    paths = compact(process.env.NODE_PATH.split(path.delimiter)).concat(paths);
  } else {
    // global node_modules should be 5 directory up this one (most of the time)
    paths.push(path.join(__dirname, '../../../..'));

    // adds support for generator resolving when yeoman-generator has been linked
    paths.push(path.join(path.dirname(process.argv[1]), '../..'));

    // Default paths for each system
    if (win32) {
      paths.push(path.join(process.env.APPDATA, 'npm/node_modules'));
    } else {
      paths.push('/usr/lib/node_modules');
      paths.push('/usr/local/lib/node_modules');
    }
  }
  
  // nvm on os x
  // For some reason, nvm doens't get put on NODE_PATH
  // unless you do it manually.
  if (!win32) {
    paths.push(homeDir('.nvm/*/lib/node_modules'));
  }
  
  return paths.reverse();
};