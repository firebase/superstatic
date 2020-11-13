/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

import * as fs from "fs";
import * as mime from "mime-types";
import * as _ from "lodash";

const template = fs
  .readFileSync(`${__dirname}/../../templates/env.js.template`)
  .toString();

/**
 * 
 */
export function env(spec: { env: any }) {
  return (req: any, res: any, next: () => {}) => {
    const config = req.superstatic?.env;
    let env;
    if (spec.env || config) {
      env = Object.assign({}, config, spec.env);
    } else {
      return next();
    }

    if (req.url === "/__/env.json") {
      res.superstatic.handleData({
        data: JSON.stringify(env, null, 2),
        contentType: mime.contentType("json")
      });
      return;
    } else if (req.url === "/__/env.js") {
      const payload = template.replace("{{ENV}}", JSON.stringify(env));
      res.superstatic.handleData({
        data: payload,
        contentType: mime.contentType("js")
      });
      return;
    }

    return next();
  };
}
