/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const fs = require("fs-extra");
const request = require("supertest");
const connect = require("connect");
const join = require("join-path");
const expect = require("chai").expect;

const notFound = require("../../../lib/middleware/not-found");
const Responder = require("../../../lib/responder");

describe("not found", () => {
  let app;

  beforeEach(() => {
    fs.outputFileSync(".tmp/not-found.html", "not found file", "utf8");

    app = connect().use((req, res, next) => {
      res.superstatic = new Responder(req, res, {
        provider: {}
      });
      next();
    });
  });

  afterEach(() => {
    fs.removeSync(".tmp");
  });

  it("serves the file", (done) => {
    app.use(
      notFound({
        errorPage: ".tmp/not-found.html"
      })
    );

    request(app)
      .get("/anything")
      .expect(404)
      .expect("not found file")
      .end(done);
  });

  it("throws on file read error", () => {
    expect(() => {
      notFound({
        errorPage: ".tmp/does-not-exist.html"
      });
    }).to.throw("ENOENT");
  });

  it("caches for one hour", (done) => {
    app.use(
      notFound({
        errorPage: join(process.cwd(), ".tmp/not-found.html")
      })
    );

    request(app)
      .get("/anything")
      .expect(404)
      .expect("Cache-Control", "public, max-age=3600")
      .end(done);
  });
});
