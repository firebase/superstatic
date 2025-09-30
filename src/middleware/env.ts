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

import * as fs from "fs";
import * as mime from "mime-types";

const template = fs
  .readFileSync(`${__dirname}/../../templates/env.js.template`)
  .toString();

interface SuperstaticRequest {
  superstatic: {
    env: Record<string, string>;
  };
}

interface SuperstaticResponse {
  superstatic: {
    handleData: (d: Record<string, string>) => void;
  };
}

/**
 * Returns middleware for `/__/env.json|js`.
 * @param spec superstatic options.
 * @param spec.env environment variables.
 * @returns middleware.
 */
export function env(spec: { env: Record<string, string> }) {
  return (
    req: Request & SuperstaticRequest,
    res: Response & SuperstaticResponse,
    next: () => void,
  ): void => {
    // const config = req.superstatic.env;
    let env = undefined;
    if (spec.env || req.superstatic.env) {
      env = Object.assign({}, req.superstatic.env, spec.env);
    } else {
      return next();
    }

    if (req.url === "/__/env.json") {
      res.superstatic.handleData({
        data: JSON.stringify(env, null, 2),
        contentType: mime.contentType("json") || "",
      });
    } else if (req.url === "/__/env.js") {
      const payload = template.replace("{{ENV}}", JSON.stringify(env));
      res.superstatic.handleData({
        data: payload,
        contentType: mime.contentType("js") || "",
      });
    }

    return next();
  };
}

module.exports = env;
