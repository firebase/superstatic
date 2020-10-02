/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const fs = require("fs-extra");
const request = require("supertest");
const connect = require("connect");

const helpers = require("../../helpers");
const missing = helpers.decorator(require("../../../lib/middleware/missing"));
const fsProvider = require("../../../lib/providers/fs");
const Responder = require("../../../lib/responder");

describe("custom not found", () => {
  const provider = fsProvider({
    public: ".tmp"
  });
  let app;

  beforeEach(() => {
    fs.outputFileSync(".tmp/not-found.html", "custom not found file", "utf8");

    app = connect().use(
      (req, res, next) => {
        res.superstatic = new Responder(req, res, { provider: provider });
        next();
      },
      { provider: provider }
    );
  });

  afterEach(() => {
    fs.removeSync(".tmp");
  });

  it("serves the file", (done) => {
    app.use(
      missing(
        {
          errorPage: "/not-found.html"
        },
        { provider: provider }
      )
    );

    request(app)
      .get("/anything")
      .expect(404)
      .expect("custom not found file")
      .end(done);
  });

  it("skips middleware on file serve error", (done) => {
    app
      .use(
        missing(
          {
            errorPage: "/does-not-exist.html"
          },
          { provider: provider }
        )
      )
      .use((req, res) => {
        res.end("does not exist");
      });

    request(app)
      .get("/anything")
      .expect("does not exist")
      .end(done);
  });
});
