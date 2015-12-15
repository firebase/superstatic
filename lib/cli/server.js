/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var join = require('join-path');

module.exports = function(cli, imports, ready) {
  var server = imports.server;

  cli.default()
    .handler(function(data, flags, done) {
      var config = cli.get('config');
      var port = cli.get('port');
      var hostname = cli.get('hostname');
      var debug = cli.get('debug');
      var gzip = cli.get('gzip');
      var env = cli.get('env');
      var live = cli.get('live');

      var workingDirectory = data[0];

      var options = {
        config: config,
        port: port,
        hostname: hostname,
        gzip: gzip,
        debug: debug,
        env: env,
        live: live
      };

      cli.set('options', options);

      if (typeof workingDirectory === 'function') {
        done = workingDirectory;
        workingDirectory = undefined;
      }

      if (workingDirectory) {
        options.cwd = join(process.cwd(), workingDirectory);
      }

      // Start server
      var app = server(options);

      cli.set('server', app.listen(done));
      cli.set('app', app);
    });

  ready();
};
