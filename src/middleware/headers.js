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

const _ = require("lodash");
const slasher = require("glob-slasher");
const urlParser = require("fast-url-parser");
const onHeaders = require("on-headers");
const patterns = require("../utils/patterns");

const normalizedConfigHeaders = function (spec, config) {
  const out = config || [];
  if (_.isArray(config)) {
    const _isAllowed = function (headerToSet) {
      return _.includes(spec.allowedHeaders, headerToSet.key.toLowerCase());
    };

    for (const c of config) {
      c.source = slasher(c.source);
      c.headers = c.headers || [];
      if (spec.allowedHeaders) {
        c.headers = c.headers.filter(_isAllowed);
      }
    }
  }

  return out;
};

const matcher = function (configHeaders) {
  return function (url) {
    return configHeaders
      .filter((configHeader) => {
        return patterns.configMatcher(url, configHeader);
      })
      .reduce((out, val) => {
        val.headers.forEach((headerToSet) => {
          out.push(headerToSet);
        });
        return out;
      }, []);
  };
};

module.exports = function (spec) {
  return function (req, res, next) {
    const config = _.get(req, "superstatic.headers");
    if (!config) {
      return next();
    }

    const headers = matcher(normalizedConfigHeaders(spec, config));
    const pathname = urlParser.parse(req.url).pathname;
    const matches = headers(slasher(pathname));

    onHeaders(res, () => {
      _.forEach(matches, (header) => {
        res.setHeader(header.key, header.value);
      });
    });

    return next();
  };
};
