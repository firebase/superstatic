/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const fs = require("fs");
const template = fs
  .readFileSync(__dirname + "/../assets/env.js.template")
  .toString();
const mime = require("mime-types");
const _ = require("lodash");

module.exports = function(spec) {
  return function(req, res, next) {
    const config = _.get(req, "superstatic.env");
    let env;
    if (spec.env || config) {
      env = _.assign({}, config, spec.env);
    } else {
      return next();
    }

    if (req.url === "/__/env.json") {
      res.superstatic.handleData({
        data: JSON.stringify(env, null, 2),
        contentType: mime.contentType("json")
      });
      return undefined;
    } else if (req.url === "/__/env.js") {
      const payload = template.replace("{{ENV}}", JSON.stringify(env));
      res.superstatic.handleData({
        data: payload,
        contentType: mime.contentType("js")
      });
      return undefined;
    }

    return next();
  };
};
