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
import { createRequire } from "node:module";

import { SuperstaticRequest, SuperstaticResponse } from "../options";

type BasicAuthMiddleware = (
  user: string,
  pass?: string,
  realm?: string,
) => connect.NextHandleFunction;

const requireModule: (id: string) => unknown = createRequire(__filename);
const basicAuth = requireModule("basic-auth-connect") as BasicAuthMiddleware;

/**
 * Returns middleware for HTTP Basic authentication.
 * @param spec superstatic options.
 * @param spec.protect colon-separated `user:pass[:realm]` credentials.
 * @returns middleware.
 */
function protect(
  spec: { protect?: string } = {},
): (
  req: SuperstaticRequest,
  res: SuperstaticResponse,
  next: connect.NextFunction,
) => void {
  return function (
    req: SuperstaticRequest,
    res: SuperstaticResponse,
    next: connect.NextFunction,
  ): void {
    const credentials = spec.protect ?? req.superstatic?.protect;
    if (credentials) {
      const [user, pass, realm] = credentials.split(":");
      basicAuth(user, pass, realm)(req, res, next);
      return;
    }

    next();
  };
}

export = protect;
