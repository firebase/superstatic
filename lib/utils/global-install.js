/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var async = require('async');
var spawn = require('child_process').spawn;
var spinner = require('char-spinner');

module.exports = function globalInstall (packages, done) {

  var spinnerInterval = spinner({});

  async.each(packages, function (packageName, installed) {

   spawn('npm', ['install', packageName, '-g'])
    .on('close', installed);
  }, function (err) {

    // Stop spinner and clear line
    clearInterval(spinnerInterval);
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    done(err);
  });
};
