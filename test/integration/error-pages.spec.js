/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const fs = require("fs-extra");
const connect = require("connect");
const request = require("supertest");

const superstatic = require("../../");

const options = function() {
  return {
    fallthrough: false,
    config: {
      public: ".tmp"
    }
  };
};

describe("error page", () => {
  beforeEach(() => {
    fs.outputFileSync(".tmp/default-error.html", "default error", "utf8");
    fs.outputFileSync(".tmp/error.html", "config error", "utf8");
  });

  afterEach(() => {
    fs.removeSync(".tmp");
  });

  it("from 404.html", (done) => {
    fs.outputFileSync(".tmp/404.html", "404.html error", "utf8");
    const opts = options();

    const app = connect().use(superstatic(opts));

    request(app)
      .get("/does-not-exist")
      .expect(404)
      .expect("404.html error")
      .expect("Content-Type", "text/html; charset=utf-8")
      .end(done);
  });

  it("from custom error page", (done) => {
    const opts = options();
    opts.config.errorPage = "/error.html";

    const app = connect().use(superstatic(opts));

    request(app)
      .get("/does-not-exist")
      .expect(404)
      .expect("config error")
      .expect("Content-Type", "text/html; charset=utf-8")
      .end(done);
  });

  it("falls back to default when configured error page does not exist", (done) => {
    const opts = options();

    opts.errorPage = ".tmp/default-error.html";

    const app = connect().use(superstatic(opts));

    request(app)
      .get("/does-not-exist")
      .expect(404)
      .expect("default error")
      .expect("Content-Type", "text/html; charset=utf-8")
      .end(done);
  });
});
