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
import * as path from "node:path";
import { ServerResponse } from "node:http";
import connect from "connect";
import { SuperstaticRequest, SuperstaticResponse } from "../options";

const DEFAULT_ERROR_PAGE = path.join(
  __dirname,
  "../../templates/not_found.html",
);

interface NotFoundOptions {
  errorPage?: string;
}

/**
 * Returns middleware for serving the default not-found error page.
 * @param spec superstatic options.
 * @param spec.errorPage optional path to a local fallback error page.
 * @returns middleware.
 */
function notFound(
  spec: NotFoundOptions = {},
): (
  req: SuperstaticRequest | connect.IncomingMessage,
  res: SuperstaticResponse | ServerResponse,
) => void {
  const content = fs.readFileSync(spec.errorPage ?? DEFAULT_ERROR_PAGE);

  return (
    _req: SuperstaticRequest | connect.IncomingMessage,
    res: SuperstaticResponse | ServerResponse,
  ): void => {
    // NOTE: provider isn't used to serve the pages
    // because this middleware should only serve local
    // static pages around the same directory as the
    // superstatic middleware

    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.end(content);
  };
}

export = notFound;
