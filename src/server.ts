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

import connect from "connect";
import networkLogger from "morgan";
import * as http from "node:http";

import { ServerOptions } from "./options";
import superstatic from "./superstatic";

/**
 * Creates a Connect server configured with Superstatic middleware.
 * @param spec superstatic server options.
 * @returns configured Connect server with a zero-arg/callback `listen` method.
 */
function server(spec: ServerOptions = {}): server.SuperstaticServer {
  spec.fallthrough ??= false;

  const app = connect();
  const listen = app.listen.bind(app) as (
    port?: number,
    hostname?: string,
    callback?: (err?: unknown) => void,
  ) => http.Server;

  // Override method because port and host are given
  // in the spec object
  const serverApp = app as unknown as server.SuperstaticServer;
  serverApp.listen = function (done?: (err?: unknown) => void): http.Server {
    app.use(superstatic(spec));

    // Start server
    return listen(spec.port, spec.hostname ?? spec.host, done);
  };

  // Console output for network requests
  if (spec.debug) {
    app.use(networkLogger("combined"));
  }

  return serverApp;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace server {
  export type SuperstaticServer = ((
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next?: connect.NextFunction,
  ) => void) &
    Omit<connect.Server, "listen"> & {
      listen(done?: (err?: unknown) => void): http.Server;
    };
}

export = server;
