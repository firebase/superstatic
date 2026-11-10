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

import {
  IncomingMessage as ConnectIncomingMessage,
  NextFunction,
  NextHandleFunction,
} from "connect";
import { ServerResponse } from "node:http";
import { createRequire } from "node:module";

import { Configuration } from "../config";

type Responder = import("../responder");

type BasicAuthMiddleware = (
  user: string,
  pass: string,
  realm?: string,
) => NextHandleFunction;

const requireModule: (id: string) => unknown = createRequire(__filename);
const basicAuth = requireModule("basic-auth-connect") as BasicAuthMiddleware;

/**
 * Returns middleware for HTTP Basic authentication.
 * @param spec superstatic options.
 * @param spec.protect colon-separated `user:pass` credentials.
 * @returns middleware.
 */
function protect(
  spec: { protect?: string } = {},
): (
  req: ConnectIncomingMessage & { superstatic?: Configuration },
  res: ServerResponse & { superstatic?: Responder },
  next: NextFunction,
) => void {
  return function (
    req: ConnectIncomingMessage & { superstatic?: Configuration },
    res: ServerResponse & { superstatic?: Responder },
    next: NextFunction,
  ): void {
    let credentials = req.superstatic?.protect;
    if (spec.protect) {
      credentials = spec.protect;
    }
    if (!credentials) {
      next();
      return;
    }

    const colonIndex = credentials.indexOf(":");
    if (colonIndex === -1) {
      res.statusCode = 401;
      res.setHeader("WWW-Authenticate", 'Basic realm="Authorization Required"');
      res.end("Unauthorized");
      return;
    }

    const user = credentials.slice(0, colonIndex);
    const pass = credentials.slice(colonIndex + 1);
    basicAuth(user, pass)(req, res, next);
  };
}

export = protect;
