/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

import * as fs from "fs";
import * as mime from "mime-types";

const template = fs
  .readFileSync(`${__dirname}/../../templates/env.js.template`)
  .toString();

interface SuperstaticRequest {
  superstatic: {
    env: { [key: string]: string };
  };
}

interface SuperstaticResponse {
  superstatic: {
    handleData: (d: { [key: string]: string }) => void;
  };
}

/**
 * Returns middleware for `/__/env.json|js`.
 * @param spec superstatic options.
 * @param spec.env environment variables.
 * @return middleware.
 */
export function env(spec: { env: { [key: string]: string } }) {
  return (
    req: Request & SuperstaticRequest,
    res: Response & SuperstaticResponse,
    next: () => void
  ): void => {
    // const config = req.superstatic.env;
    let env;
    if (spec.env || req.superstatic.env) {
      env = Object.assign({}, req.superstatic.env, spec.env);
    } else {
      return next();
    }

    if (req.url === "/__/env.json") {
      res.superstatic.handleData({
        data: JSON.stringify(env, null, 2),
        contentType: mime.contentType("json") || "",
      });
    } else if (req.url === "/__/env.js") {
      const payload = template.replace("{{ENV}}", JSON.stringify(env));
      res.superstatic.handleData({
        data: payload,
        contentType: mime.contentType("js") || "",
      });
    }

    return next();
  };
}

module.exports = env;
