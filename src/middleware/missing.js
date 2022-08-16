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
const { providerResult } = require("../utils/file-resolver");

module.exports = function (spec) {
  let defaultErrorContent = undefined;
  if (spec.errorPage) {
    defaultErrorContent = fs.readFileSync(spec.errorPage, "utf8");
  }

  return function (req, res, next) {
    const config = req.superstatic;
    const errorPage = config.errorPage || "/404.html";

    // To handle i18n, we will use the providerResult function to try to
    // resolve the path with i18n in mind. If we get a result from that,
    // it is a stream we can hand off to handleFileStream directly.
    void providerResult(req, res, errorPage).then((resolvedErrorPage) => {
      setHeaders(spec)(
        {
          superstatic: config,
          url: errorPage,
        },
        res,
        () => {
          if (resolvedErrorPage) {
            const responded = res.superstatic.handleFileStream(
              { file: errorPage, status: 404 },
              resolvedErrorPage
            );
            // Only return if we've responded. If it errored for some reason,
            // we can allow the handler to continue and try other error pages.
            if (responded) {
              return;
            }
          }
          const handles = [{ file: errorPage, status: 404 }];
          if (defaultErrorContent) {
            handles.push({ data: defaultErrorContent, status: 404 });
          }
          res.superstatic.handle(handles, next);
        }
      );
    });
  };
};
