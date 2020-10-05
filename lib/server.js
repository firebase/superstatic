/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const _ = require("lodash");
const connect = require("connect");
const networkLogger = require("morgan");

const superstatic = require("./superstatic");

module.exports = function(spec) {
  spec = _.assign({ fallthrough: false }, spec);

  const app = connect();
  const listen = app.listen.bind(app);

  // Override method because port and host are given
  // in the spec object
  app.listen = function(done) {
    let server = {};

    app.use(superstatic(spec));

    // Start server
    server = listen(spec.port, spec.hostname || spec.host, done);

    return server;
  };

  // Console output for network requests
  if (spec.debug) {
    app.use(networkLogger("combined"));
  }

  return app;
};
