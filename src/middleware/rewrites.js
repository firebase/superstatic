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

const slasher = require("glob-slasher");
const urlParser = require("fast-url-parser");
const patterns = require("../utils/patterns");

const normalizeConfig = function (config) {
  return config || [];
};

const matcher = function (rewrites) {
  return function (url) {
    for (let i = 0; i < rewrites.length; i++) {
      if (patterns.configMatcher(url, rewrites[i])) {
        return rewrites[i];
      }
    }
    return undefined;
  };
};

module.exports = function () {
  return function (req, res, next) {
    const rewrites = matcher(normalizeConfig(req.superstatic.rewrites));

    const pathname = urlParser.parse(req.url).pathname;
    const match = rewrites(slasher(pathname));

    if (!match) {
      return next();
    }

    res.statusCode = 200;

    return res.superstatic.handle({ rewrite: match }, next);
  };
};
