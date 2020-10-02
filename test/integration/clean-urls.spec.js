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
    config: {
      public: ".tmp"
    }
  };
};

describe("clean urls", () => {
  beforeEach(() => {
    fs.outputFileSync(".tmp/index.html", "index", "utf8");
    fs.outputFileSync(".tmp/test.html", "test", "utf8");
    fs.outputFileSync(".tmp/app.js", 'console.log("js")', "utf8");
    fs.outputFileSync(".tmp/dir/index.html", "dir index", "utf8");
    fs.outputFileSync(".tmp/dir/sub.html", "dir sub", "utf8");
  });

  afterEach(() => {
    fs.removeSync(".tmp");
  });

  it("not configured", (done) => {
    const opts = options();

    const app = connect().use(superstatic(opts));

    request(app)
      .get("/test")
      .expect(404)
      .end(done);
  });

  it("redirects html file", (done) => {
    const opts = options();

    opts.config.cleanUrls = true;

    const app = connect().use(superstatic(opts));

    request(app)
      .get("/test.html")
      .expect(301)
      .expect("Location", "/test")
      .end(done);
  });

  it("serves html file", (done) => {
    const opts = options();

    opts.config.cleanUrls = true;

    const app = connect().use(superstatic(opts));

    request(app)
      .get("/test")
      .expect(200)
      .expect("test")
      .end(done);
  });

  it("redirects using globs", (done) => {
    const opts = options();

    opts.config.cleanUrls = ["/*.html"];

    const app = connect().use(superstatic(opts));

    request(app)
      .get("/test.html")
      .expect(301)
      .expect("Location", "/test")
      .end(done);
  });

  it("serves html file using globs", (done) => {
    const opts = options();

    opts.config.cleanUrls = ["*.html"];

    const app = connect().use(superstatic(opts));

    request(app)
      .get("/test")
      .expect(200)
      .expect("test")
      .end(done);
  });
});
