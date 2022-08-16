/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
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
    const errorPage = config.errorPage || "/404.html";

    // To handle i18n, we will use the providerResult function to try to
    // resolve the path with i18n in mind. If we get a result from that,
    // it is a stream we can hand off to handleFileStream directly.
    setHeaders(spec)(
      {
        superstatic: config,
        url: errorPage,
      },
      res,
      () => {
        // if (resolvedErrorPage) {
        //   const responded = res.superstatic.handleFileStream(
        //     { file: errorPage, status: 404 },
        //     resolvedErrorPage
        //   );
        //   // Only return if we've responded. If it errored for some reason,
        //   // we can allow the handler to continue and try other error pages.
        //   if (responded) {
        //     return;
        //   }
        // }
        const handles = [];
        const i18n = req.superstatic.i18n;
        if (i18n && i18n.root) {
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
      }
    );
  };
};
