/**
 * Copyright (c) 2022 Google LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const connect = require("connect");
const networkLogger = require("morgan");

const superstatic = require("./superstatic");
const { ServerOptions } = require("./options");

/**
 * @param {ServerOptions} spec superstatic options.
 * @returns unknown
 */
module.exports = function (spec) {
  if (spec.fallthrough === undefined) {
    spec.fallthrough = false;
  }

  const app = connect();
  const listen = app.listen.bind(app);

  // Override method because port and host are given
  // in the spec object
  app.listen = function (done) {
    let server = {};

    app.use(superstatic(spec));

    // Start server
    server = listen(spec.port, spec.hostname ?? spec.host, done);

    return server;
  };

  // Console output for network requests
  if (spec.debug) {
    app.use(networkLogger("combined"));
  }

  return app;
};
