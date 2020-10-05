/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const superstatic = require("../../lib/server");

const spec = {
  port: 3474,
  config: {
    public: "./app"
  },
  cwd: __dirname,
  errorPage: __dirname + "/error.html",
  compression: true,
  debug: true
};

const app = superstatic(spec);
app.listen((err) => {
  if (err) {
    console.log(err);
  }
  console.log("Superstatic now serving on port 3474 ...");
});
