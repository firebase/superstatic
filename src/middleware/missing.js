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

const fs = require("fs");

const setHeaders = require("./headers");
const { i18nContentOptions } = require("../utils/i18n");

module.exports = function (spec) {
  let defaultErrorContent = undefined;
  if (spec.errorPage) {
    defaultErrorContent = fs.readFileSync(spec.errorPage, "utf8");
  }

  return function (req, res, next) {
    const config = req.superstatic;
    const errorPage = config.errorPage ?? "/404.html";

    setHeaders(spec)(
      {
        superstatic: config,
        url: errorPage,
      },
      res,
      () => {
        const handles = [];
        const i18n = req.superstatic.i18n;
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
        res.superstatic.handle(handles, next);
      },
    );
  };
};
