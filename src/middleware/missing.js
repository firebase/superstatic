/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const setHeaders = require("./headers");
const fs = require("fs");

module.exports = function(spec) {
  let defaultErrorContent;
  if (spec.errorPage) {
    defaultErrorContent = fs.readFileSync(spec.errorPage, "utf8");
  }

  return function(req, res, next) {
    const config = req.superstatic;
    const errorPage = config.errorPage || "/404.html";

    setHeaders(spec)(
      {
        superstatic: config,
        url: errorPage
      },
      res,
      () => {
        const handles = [{ file: errorPage, status: 404 }];
        if (defaultErrorContent) {
          handles.push({ data: defaultErrorContent, status: 404 });
        }
        res.superstatic.handle(handles, next);
      }
    );
  };
};
