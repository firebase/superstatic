/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const join = require("join-path");

module.exports = function(cli, imports, ready) {
  const server = imports.server;

  cli.default().handler((data, flags, done) => {
    const config = cli.get("config");
    const port = cli.get("port");
    const hostname = cli.get("hostname");
    const debug = cli.get("debug");
    const compression = cli.get("compression");
    const env = cli.get("env");
    const live = cli.get("live");

    let workingDirectory = data[0];

    const options = {
      config: config,
      port: port,
      hostname: hostname,
      compression: compression,
      debug: debug,
      env: env,
      live: live
    };

    cli.set("options", options);

    if (typeof workingDirectory === "function") {
      done = workingDirectory;
      workingDirectory = undefined;
    }

    if (workingDirectory) {
      options.cwd = join(process.cwd(), workingDirectory);
    }

    // Start server
    const app = server(options);

    cli.set("server", app.listen(done));
    cli.set("app", app);
  });

  ready();
};
