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

import * as fs from "node:fs";
import { ServerResponse } from "node:http";
import {
  IncomingMessage as ConnectIncomingMessage,
  NextFunction,
  NextHandleFunction,
} from "connect";
import * as mime from "mime-types";
import { Configuration } from "../config";

type Responder = import("../responder");

const template = fs
  .readFileSync(`${__dirname}/../../templates/env.js.template`)
  .toString();

function sendEnvResponse(
  res: ServerResponse & { superstatic?: Responder },
  data: string,
  contentType: string,
): void {
  if (res.superstatic) {
    void res.superstatic.handleData({ data, contentType });
    return;
  }
  res.statusCode = 200;
  if (contentType) {
    res.setHeader("Content-Type", contentType);
  }
  res.end(data);
}

/**
 * Returns middleware for `/__/env.json|js`.
 * @param spec superstatic options.
 * @param spec.env environment variables.
 * @returns middleware.
 */
function env(spec: env.EnvOptions = {}): NextHandleFunction {
  return (
    req: ConnectIncomingMessage & { superstatic?: Configuration },
    res: ServerResponse & { superstatic?: Responder },
    next: NextFunction,
  ): void => {
    const configEnv = req.superstatic?.env;
    if (!spec.env && !configEnv) {
      next();
      return;
    }
    const mergedEnv = Object.assign({}, configEnv, spec.env);

    if (req.url === "/__/env.json") {
      sendEnvResponse(
        res,
        JSON.stringify(mergedEnv, null, 2),
        mime.contentType("json") || "",
      );
      return;
    } else if (req.url === "/__/env.js") {
      const payload = template.replace("{{ENV}}", JSON.stringify(mergedEnv));
      sendEnvResponse(res, payload, mime.contentType("js") || "");
      return;
    }

    next();
  };
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace env {
  export interface EnvOptions {
    env?: Record<string, string>;
  }
}

export = env;
