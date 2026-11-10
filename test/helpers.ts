/**
 * Copyright (c) 2026 Google LLC
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
import { Configuration } from "../src/config";
import { SuperstaticRequest, SuperstaticResponse } from "../src/options";

export type SuperstaticMiddlewareHandler = (
  req: SuperstaticRequest,
  res: SuperstaticResponse,
  next: NextFunction,
) => unknown;

/**
 * Wraps a middleware factory so tests can inject `req.superstatic` config.
 * @param middleware middleware factory under test.
 * @returns wrapped middleware factory accepting superstatic config and middleware spec.
 */
export function decorator<Spec = Record<string, unknown>>(
  middleware: (spec: Spec) => SuperstaticMiddlewareHandler,
): (config?: Configuration, spec?: Spec) => NextHandleFunction {
  return function (config?: Configuration, spec?: Spec): NextHandleFunction {
    return function (
      req: ConnectIncomingMessage,
      res: ServerResponse,
      next: NextFunction,
    ): unknown {
      const superstaticReq = req as SuperstaticRequest;
      superstaticReq.superstatic = config ?? {};
      return middleware(spec as Spec)(
        superstaticReq,
        res as SuperstaticResponse,
        next,
      );
    };
  };
}
