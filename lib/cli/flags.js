/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

module.exports = function(cli, options, ready) {
  cli.flag('--port', '-p')
    .handler(function(num, done) {
      cli.set('port', num);
      done();
    });

  cli.flag('--host', '--hostname')
    .handler(function(hostname, done) {
      cli.set('hostname', hostname);
      done();
    });

  cli.flag('--config', '-c')
    .handler(function(config, done) {
      cli.set('config', config);
      done();
    });

  cli.flag('--debug')
    .handler(function(shouldDebug, done) {
      cli.set('debug', shouldDebug);
      done();
    });

  cli.flag('--gzip')
    .handler(function(shouldCompress, done) {
      cli.set('compression', shouldCompress);
      done();
    });

  cli.flag('--compression')
    .handler(function(shouldCompress, done) {
      cli.set('compression', shouldCompress);
      done();
    });

  cli.flag('--version',  '-v')
    .handler(function(v, done) {
      var pkg = require('../../package.json');
      console.log(pkg.version);
      done();
      process.exit(0);
    });

  ready();
};
