/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const fs = require("fs-extra");
const expect = require("chai").expect;
const request = require("supertest");
const connect = require("connect");

const helpers = require("../../helpers");
const files = helpers.decorator(require("../../../lib/middleware/files"));
const fsProvider = require("../../../lib/providers/fs");
const Responder = require("../../../lib/responder");

const basePathConfigs = [
  ["", "static server with trailing slash customization"],
  [
    "/base/path",
    "static server under base path, with trailing slash customization"
  ]
];

basePathConfigs.forEach(([basePath, testTitle]) => {
  describe(testTitle, () => {
    const provider = fsProvider({
      public: ".tmp"
    });
    let app;

    const appUse = (middleware) => {
      if (basePath === "") {
        return app.use(middleware);
      } else {
        return app.use(basePath, middleware);
      }
    };

    beforeEach(() => {
      fs.outputFileSync(".tmp/foo.html", "foo.html content", "utf8");
      fs.outputFileSync(
        ".tmp/foo/index.html",
        "foo/index.html content",
        "utf8"
      );
      fs.outputFileSync(".tmp/foo/bar.html", "foo/bar.html content", "utf8");

      app = connect();
      appUse((req, res, next) => {
        res.superstatic = new Responder(req, res, {
          provider: provider
        });
        next();
      });
    });

    afterEach(() => {
      fs.removeSync(".tmp");
    });

    it("serves html file", (done) => {
      appUse(files({}, { provider: provider }));

      request(app)
        .get(basePath + "/foo.html")
        .expect(200)
        .expect("foo.html content")
        .expect("content-type", "text/html; charset=utf-8")
        .end(done);
    });

    it("serves html file with unicode name", (done) => {
      fs.outputFileSync(".tmp/äää.html", "test", "utf8");

      appUse(files({}, { provider: provider }));

      request(app)
        .get(basePath + "/äää.html")
        .expect(200)
        .expect("test")
        .expect("content-type", "text/html; charset=utf-8")
        .end(done);
    });

    it("serves css file", (done) => {
      fs.outputFileSync(".tmp/style.css", "body {}", "utf8");

      appUse(files({}, { provider: provider }));

      request(app)
        .get(basePath + "/style.css")
        .expect(200)
        .expect("body {}")
        .expect("content-type", "text/css; charset=utf-8")
        .end(done);
    });

    it("serves a directory index file", (done) => {
      fs.outputFileSync(".tmp/index.html", "test", "utf8");

      appUse(files({}, { provider: provider }));

      request(app)
        .get(basePath + "/")
        .expect(200)
        .expect("test")
        .expect("content-type", "text/html; charset=utf-8")
        .end(done);
    });

    it("serves a file with query parameters", (done) => {
      fs.outputFileSync(".tmp/superstatic.html", "test", "utf8");

      appUse(files({}, { provider: provider }));

      request(app)
        .get(basePath + "/superstatic.html?key=value")
        .expect(200)
        .expect("test")
        .end(done);
    });

    it("does not redirect the root url because of the trailing slash", (done) => {
      fs.outputFileSync(".tmp/index.html", "an actual index", "utf8");

      appUse(files({}, { provider: provider }));

      request(app)
        .get(basePath + "/")
        .expect(200)
        .expect("an actual index")
        .end(done);
    });

    it("does not redirect for directory index files", (done) => {
      appUse(files({}, { provider: provider }));

      request(app)
        .get(basePath + "/foo/")
        .expect(200)
        .expect((data) => {
          expect(data.req.path).to.equal(basePath + "/foo/");
        })
        .end(done);
    });

    it("function() directory index to have a trailing slash", (done) => {
      appUse(files({}, { provider: provider }));

      request(app)
        .get(basePath + "/foo")
        .expect((req) => {
          expect(req.headers.location).to.equal(basePath + "/foo/");
        })
        .expect(301)
        .end(done);
    });

    it("preserves query parameters and slash on subdirectory directory index redirect", (done) => {
      appUse(files({}, { provider: provider }));

      request(app)
        .get(basePath + "/foo?query=params")
        .expect((req) => {
          expect(req.headers.location).to.equal(
            basePath + "/foo/?query=params"
          );
        })
        .expect(301)
        .end(done);
    });

    describe("force trailing slash", () => {
      it("adds slash to url with no extension", (done) => {
        appUse(files({ trailingSlash: true }, { provider: provider }));

        request(app)
          .get(basePath + "/foo")
          .expect(301)
          .expect("Location", basePath + "/foo/")
          .end(done);
      });
    });

    describe("force remove trailing slash", () => {
      it("removes trailing slash on urls with no file extension", (done) => {
        appUse(files({ trailingSlash: false }, { provider: provider }));

        request(app)
          .get(basePath + "/foo/")
          .expect(301)
          .expect("Location", basePath + "/foo")
          .end(done);
      });

      it("returns a 404 if a trailing slash was added to a valid path", (done) => {
        appUse(files({ trailingSlash: false }, { provider: provider }));

        request(app)
          .get(basePath + "/foo.html/")
          .expect(404)
          .end(done);
      });

      it("removes trailing slash on directory index urls", (done) => {
        appUse(files({ trailingSlash: false }, { provider: provider }));

        request(app)
          .get(basePath + "/foo/")
          .expect(301)
          .expect("Location", basePath + "/foo")
          .end(done);
      });

      it("normalizes multiple leading slashes on a redirect", (done) => {
        appUse(files({ trailingSlash: false }, { provider: provider }));

        request(app)
          .get(basePath + "/foo////")
          .expect(301)
          .expect("Location", basePath + "/foo")
          .end(done);
      });
    });

    [
      {
        trailingSlashBehavior: undefined,
        cleanUrls: false,
        tests: [
          { path: "/foo", wantRedirect: "/foo/" },
          { path: "/foo.html", wantContent: "foo.html content" },
          { path: "/foo.html/", wantNotFound: true },
          { path: "/foo/", wantContent: "foo/index.html content" },
          { path: "/foo/bar", wantNotFound: true },
          { path: "/foo/bar.html", wantContent: "foo/bar.html content" },
          { path: "/foo/bar.html/", wantNotFound: true },
          { path: "/foo/bar/", wantNotFound: true },
          { path: "/foo/index", wantNotFound: true },
          { path: "/foo/index.html", wantContent: "foo/index.html content" },
          { path: "/foo/index.html/", wantNotFound: true }
        ]
      },
      {
        trailingSlashBehavior: false,
        cleanUrls: false,
        tests: [
          { path: "/foo", wantContent: "foo/index.html content" },
          { path: "/foo.html", wantContent: "foo.html content" },
          { path: "/foo.html/", wantNotFound: true },
          { path: "/foo/", wantRedirect: "/foo" },
          { path: "/foo/bar", wantNotFound: true },
          { path: "/foo/bar.html", wantContent: "foo/bar.html content" },
          { path: "/foo/bar.html/", wantNotFound: true },
          { path: "/foo/bar/", wantNotFound: true },
          { path: "/foo/index", wantNotFound: true },
          { path: "/foo/index.html", wantContent: "foo/index.html content" },
          { path: "/foo/index.html/", wantNotFound: true }
        ]
      },
      {
        trailingSlashBehavior: true,
        cleanUrls: false,
        tests: [
          { path: "/foo", wantRedirect: "/foo/" },
          { path: "/foo.html", wantContent: "foo.html content" },
          { path: "/foo.html/", wantNotFound: true },
          { path: "/foo/", wantContent: "foo/index.html content" },
          { path: "/foo/bar", wantNotFound: true },
          { path: "/foo/bar.html", wantContent: "foo/bar.html content" },
          { path: "/foo/bar.html/", wantNotFound: true },
          { path: "/foo/bar/", wantNotFound: true },
          { path: "/foo/index", wantNotFound: true },
          { path: "/foo/index.html", wantContent: "foo/index.html content" },
          { path: "/foo/index.html/", wantNotFound: true }
        ]
      },
      {
        trailingSlashBehavior: undefined,
        cleanUrls: true,
        tests: [
          { path: "/foo", wantContent: "foo/index.html content" },
          { path: "/foo.html", wantRedirect: "/foo" },
          { path: "/foo.html/", wantNotFound: true },
          { path: "/foo/", wantContent: "foo/index.html content" },
          { path: "/foo/bar", wantContent: "foo/bar.html content" },
          { path: "/foo/bar.html", wantRedirect: "/foo/bar" },
          { path: "/foo/bar.html/", wantNotFound: true },
          { path: "/foo/bar/", wantNotFound: true },
          { path: "/foo/index", wantRedirect: "/foo" },
          { path: "/foo/index.html", wantRedirect: "/foo" },
          { path: "/foo/index.html/", wantNotFound: true }
        ]
      },
      {
        trailingSlashBehavior: false,
        cleanUrls: true,
        tests: [
          { path: "/foo", wantContent: "foo/index.html content" },
          { path: "/foo.html", wantRedirect: "/foo" },
          { path: "/foo.html/", wantNotFound: true },
          { path: "/foo/", wantRedirect: "/foo" },
          { path: "/foo/bar", wantContent: "foo/bar.html content" },
          { path: "/foo/bar.html", wantRedirect: "/foo/bar" },
          { path: "/foo/bar.html/", wantNotFound: true },
          { path: "/foo/bar/", wantRedirect: "/foo/bar" },
          { path: "/foo/index", wantRedirect: "/foo" },
          { path: "/foo/index.html", wantRedirect: "/foo" },
          { path: "/foo/index.html/", wantNotFound: true }
        ]
      },
      {
        trailingSlashBehavior: true,
        cleanUrls: true,
        tests: [
          { path: "/foo", wantRedirect: "/foo/" },
          { path: "/foo.html", wantRedirect: "/foo/" },
          { path: "/foo.html/", wantNotFound: true },
          { path: "/foo/", wantContent: "foo/index.html content" },
          { path: "/foo/bar", wantRedirect: "/foo/bar/" },
          { path: "/foo/bar.html", wantRedirect: "/foo/bar/" },
          { path: "/foo/bar.html/", wantNotFound: true },
          { path: "/foo/bar/", wantContent: "foo/bar.html content" },
          { path: "/foo/index", wantRedirect: "/foo/" },
          { path: "/foo/index.html", wantRedirect: "/foo/" },
          { path: "/foo/index.html/", wantNotFound: true }
        ]
      }
    ].forEach((t) => {
      const desc =
        "trailing slash " +
        t.trailingSlashBehavior +
        " cleanUrls " +
        t.cleanUrls +
        " ";
      t.tests
        .map((props) =>
          Object.assign(
            {},
            props,
            { path: basePath + props.path },
            typeof props.wantRedirect === "string"
              ? { wantRedirect: basePath + props.wantRedirect }
              : {}
          )
        )
        .forEach((tt) => {
          const ttDesc = desc + JSON.stringify(tt);
          it("should behave correctly: " + ttDesc, (done) => {
            appUse(
              files(
                {
                  trailingSlash: t.trailingSlashBehavior,
                  cleanUrls: t.cleanUrls
                },
                { provider: provider }
              )
            );

            const r = request(app).get(tt.path);
            if (tt.wantRedirect) {
              r.expect(301).expect("Location", tt.wantRedirect);
            } else if (tt.wantNotFound) {
              r.expect(404);
            } else if (tt.wantContent) {
              r.expect(200).expect(tt.wantContent);
            } else {
              done(new Error("Test set up incorrectly"));
            }
            r.end(done);
          });
        });
    });
  });
});
