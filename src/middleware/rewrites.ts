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

const slasher = require("glob-slasher"); // eslint-disable-line @typescript-eslint/no-var-requires
const urlParser = require("fast-url-parser"); // eslint-disable-line @typescript-eslint/no-var-requires
import { NextFunction } from "connect";
import { IncomingMessage, ServerResponse } from "http";

import { Configuration, Rewrite } from "../config";
import Responder = require("../responder");
import * as patterns from "../utils/patterns";

function matcher(rewrites: Rewrite[]) {
  return function (url: string) {
    for (const rw of rewrites) {
      if (patterns.configMatcher(url, rw)) {
        return rw;
      }
    }
    return;
  };
}

/**
 * Looks for possible rewrites for the given req.url.
 * @return middleware for handling rewrites.
 */
module.exports = function () {
  return function (
    req: IncomingMessage & { superstatic: Configuration },
    res: ServerResponse & { superstatic: Responder },
    next: NextFunction,
  ) {
    const rewrites = matcher(req.superstatic.rewrites || []);
    const pathname: string = urlParser.parse(req.url).pathname;
    const match = rewrites(slasher(pathname));

    if (!match) {
      return next();
    }

    res.statusCode = 200;
    res.superstatic.handle({ rewrite: match }, next);
  };
};
