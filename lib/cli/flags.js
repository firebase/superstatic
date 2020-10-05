/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

module.exports = function(cli, options, ready) {
  cli.flag("--port", "-p").handler((num, done) => {
    cli.set("port", num);
    done();
  });

  cli.flag("--host", "--hostname").handler((hostname, done) => {
    cli.set("hostname", hostname);
    done();
  });

  cli.flag("--config", "-c").handler((config, done) => {
    cli.set("config", config);
    done();
  });

  cli.flag("--debug").handler((shouldDebug, done) => {
    cli.set("debug", shouldDebug);
    done();
  });

  cli.flag("--gzip").handler((shouldCompress, done) => {
    cli.set("compression", shouldCompress);
    done();
  });

  cli.flag("--compression").handler((shouldCompress, done) => {
    cli.set("compression", shouldCompress);
    done();
  });

  cli.flag("--version", "-v").handler((v, done) => {
    const pkg = require("../../package.json");
    console.log(pkg.version);
    done();
    process.exit(0);
  });

  ready();
};
