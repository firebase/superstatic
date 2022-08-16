/**
 * Copyright (c) 2022 Google LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const fs = require("fs-extra");
const request = require("supertest");
const connect = require("connect");
const helpers = require("../../helpers");
const rewrites = helpers.decorator(require("../../../src/middleware/rewrites"));
const fsProvider = require("../../../src/providers/fs");
const Responder = require("../../../src/responder");

describe("static router", () => {
  const provider = fsProvider({
    public: ".tmp",
  });
  let app;

  beforeEach(() => {
    fs.outputFileSync(".tmp/index.html", "index", "utf8");

    app = connect().use((req, res, next) => {
      res.superstatic = new Responder(req, res, {
        provider: provider,
      });
      next();
    });
  });

  afterEach(() => {
    fs.removeSync(".tmp");
  });

  it("serves a route", (done) => {
    app.use(
      rewrites({
        rewrites: [
          {
            source: "/my-route",
            destination: "/index.html",
          },
        ],
      })
    );

    request(app)
      .get("/my-route")
      .expect(200)
      .expect("index")
      .expect("content-type", "text/html; charset=utf-8")
      .end(done);
  });

  it("serves a route with a glob", (done) => {
    app.use(
      rewrites({
        rewrites: [
          {
            source: "**",
            destination: "/index.html",
          },
        ],
      })
    );

    request(app)
      .get("/my-route")
      .expect(200)
      .expect("index")
      .expect("content-type", "text/html; charset=utf-8")
      .end(done);
  });

  it("serves a route with a regex", (done) => {
    app.use(
      rewrites({
        rewrites: [
          {
            regex: ".*",
            destination: "/index.html",
          },
        ],
      })
    );

    request(app)
      .get("/my-route")
      .expect(200)
      .expect("index")
      .expect("content-type", "text/html; charset=utf-8")
      .end(done);
  });

  it("serves a route with an extension via a glob", (done) => {
    app.use(
      rewrites({
        rewrites: [
          {
            source: "**",
            destination: "/index.html",
          },
        ],
      })
    );

    request(app)
      .get("/my-route.py")
      .expect(200)
      .expect("index")
      .expect("content-type", "text/html; charset=utf-8")
      .end(done);
  });

  it("serves a route with an extension via a regex", (done) => {
    app.use(
      rewrites({
        rewrites: [
          {
            regex: "/\\w+\\.py",
            destination: "/index.html",
          },
        ],
      })
    );

    request(app)
      .get("/myroute.py")
      .expect(200)
      .expect("index")
      .expect("content-type", "text/html; charset=utf-8")
      .end(done);
  });

  it("serves a negated route", (done) => {
    app.use(
      rewrites({
        rewrites: [
          {
            source: "!/no",
            destination: "/index.html",
          },
        ],
      })
    );

    request(app)
      .get("/my-route")
      .expect(200)
      .expect("index")
      .expect("content-type", "text/html; charset=utf-8")
      .end(done);
  });

  it("skips if no match is found", (done) => {
    app.use(
      rewrites({
        rewrites: [
          {
            source: "/skip",
            destination: "/index.html",
          },
        ],
      })
    );

    request(app).get("/hi").expect(404).end(done);
  });

  it("serves the mime type of the rewritten file", (done) => {
    app.use(
      rewrites({
        rewrites: [
          {
            source: "**",
            destination: "/index.html",
          },
        ],
      })
    );

    request(app)
      .get("/index.js")
      .expect("content-type", "text/html; charset=utf-8")
      .end(done);
  });

  describe("uses first match", () => {
    beforeEach(() => {
      fs.outputFileSync(".tmp/admin/index.html", "admin index", "utf8");

      app.use(
        rewrites({
          rewrites: [
            { source: "/admin/**", destination: "/admin/index.html" },
            { source: "/something/**", destination: "/something/indexf.html" },
            { source: "**", destination: "index.html" },
          ],
        })
      );
    });

    it("first route with 1 depth route", (done) => {
      request(app)
        .get("/admin/anything")
        .expect(200)
        .expect("admin index")
        .end(done);
    });

    it("first route with 2 depth route", (done) => {
      request(app)
        .get("/admin/anything/else")
        .expect(200)
        .expect("admin index")
        .end(done);
    });

    it("second route", (done) => {
      request(app).get("/anything").expect(200).expect("index").end(done);
    });
  });
});
