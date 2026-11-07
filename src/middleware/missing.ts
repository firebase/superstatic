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
import * as fs from "node:fs";
import { ServerResponse } from "node:http";

import { Configuration } from "../config";
import Responder from "../responder";
import { i18nContentOptions } from "../utils/i18n";
import setHeaders from "./headers";

type ErrorHandle =
  { file: string; status: number } | { data: string; status: number };

/**
 * Returns middleware for serving 404 error pages.
 * @param spec superstatic options.
 * @param spec.errorPage optional fallback error page file path on disk.
 * @param spec.allowedHeaders optional allowlist of lowercase header names.
 * @param spec.provider optional provider instance.
 * @returns middleware.
 */
function missing(
  spec: {
    errorPage?: string;
    allowedHeaders?: string[];
    provider?: unknown;
  } = {},
): (
  req: connect.IncomingMessage & { superstatic?: Configuration },
  res: ServerResponse & { superstatic?: Responder },
  next: connect.NextFunction,
) => void {
  let defaultErrorContent: string | undefined;
  if (spec.errorPage) {
    defaultErrorContent = fs.readFileSync(spec.errorPage, "utf8");
  }

  return function (
    req: connect.IncomingMessage & { superstatic?: Configuration },
    res: ServerResponse & { superstatic?: Responder },
    next: connect.NextFunction,
  ): void {
    const config: Configuration = req.superstatic ?? {};
    const errorPage = config.errorPage ?? "/404.html";
    const headerReq: connect.IncomingMessage & {
      superstatic?: Configuration;
    } = Object.assign(
      Object.create(req) as connect.IncomingMessage & {
        superstatic?: Configuration;
      },
      {
        superstatic: config,
        url: errorPage,
      },
    );

    setHeaders(spec)(headerReq, res, () => {
      const handles: ErrorHandle[] = [];
      const i18n = config.i18n;
      // To handle i18n, we will try to resolve i18n paths first.
      if (i18n?.root) {
        const paths = i18nContentOptions(errorPage, req);
        for (const pth of paths) {
          handles.push({ file: pth, status: 404 });
        }
      }
      handles.push({ file: errorPage, status: 404 });
      if (defaultErrorContent) {
        handles.push({ data: defaultErrorContent, status: 404 });
      }
      if (!res.superstatic) {
        next();
        return;
      }
      res.superstatic.handle(handles, next);
    });
  };
}

export = missing;
