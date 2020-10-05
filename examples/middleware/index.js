/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const superstatic = require("../../");
const connect = require("connect");

const spec = {
  config: {
    public: "./app",
    rewrites: [
      {
        source: "**",
        destination: "/index.html"
      }
    ]
  },
  cwd: process.cwd(),
  compression: true
};

const app = connect().use(superstatic(spec));

app.listen(3474, (err) => {
  if (err) {
    console.log(err);
  }
  console.log("Superstatic now serving on port 3474 ...");
});
