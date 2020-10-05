/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const fs = require("fs-extra");
const join = require("join-path");
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

describe("serves", () => {
  beforeEach(() => {
    fs.outputFileSync(".tmp/index.html", "index", "utf-8");
    fs.outputFileSync(".tmp/test.html", "test", "utf-8");
    fs.outputFileSync(".tmp/app.js", 'console.log("js")', "utf-8");
    fs.outputFileSync(".tmp/dir/index.html", "dir index", "utf-8");
    fs.outputFileSync(".tmp/dir/sub.html", "dir sub", "utf-8");
  });

  afterEach(() => {
    fs.removeSync(".tmp");
  });

  it("static file", (done) => {
    const opts = options();

    const app = connect().use(superstatic(opts));

    request(app)
      .get("/test.html")
      .expect(200)
      .expect("test")
      .expect("Content-Type", "text/html; charset=utf-8")
      .end(done);
  });

  it("directory index file", (done) => {
    const opts = options();

    const app = connect().use(superstatic(opts));

    request(app)
      .get("/dir/")
      .expect(200)
      .expect("dir index")
      .expect("Content-Type", "text/html; charset=utf-8")
      .end(done);
  });

  it("cannot access files above the root", (done) => {
    const app = connect().use(superstatic(options()));

    request(app)
      .get("/../README.md")
      .expect(404)
      .end(done);
  });

  it("missing directory index", (done) => {
    const opts = options();

    opts.config.public = "./";

    const app = connect().use(superstatic(opts));

    request(app)
      .get("/")
      .expect(404)
      .end(done);
  });

  it("javascript file", (done) => {
    const opts = options();

    const app = connect().use(superstatic(opts));

    request(app)
      .get("/app.js")
      .expect(200)
      .expect('console.log("js")')
      .expect("Content-Type", "application/javascript; charset=utf-8")
      .end(done);
  });

  it("from custom current working directory", (done) => {
    const opts = options();

    opts.cwd = join(process.cwd(), ".tmp");
    opts.config.public = "./dir";

    const app = connect().use(superstatic(opts));

    request(app)
      .get("/index.html")
      .expect(200)
      .expect("dir index")
      .expect("Content-Type", "text/html; charset=utf-8")
      .end(done);
  });

  describe("redirects", () => {
    const opts = options();

    opts.config.redirects = [
      { source: "/from", destination: "/to" },
      { source: "/fromCustom", destination: "/toCustom", type: 302 },
      { source: "/external", destination: "http://redirect.com" }
    ];

    const app = connect().use(superstatic(opts));

    it("301", (done) => {
      request(app)
        .get("/from")
        .expect(301)
        .expect("Location", "/to")
        .end(done);
    });

    it("custom", (done) => {
      request(app)
        .get("/fromCustom")
        .expect(302)
        .expect("Location", "/toCustom")
        .end(done);
    });

    it("external urls", (done) => {
      request(app)
        .get("/external")
        .expect(301)
        .expect("Location", "http://redirect.com")
        .end(done);
    });
  });

  describe("trailing slash", () => {
    xit("removes trailling slash for file", (done) => {
      const app = connect().use(superstatic(options()));

      request(app)
        .get("/test.html/")
        .expect(301)
        .expect("Location", "/test.html")
        .end(done);
    });

    it("add trailing slash with a directory index file", (done) => {
      const app = connect().use(superstatic(options()));

      request(app)
        .get("/dir")
        .expect(301)
        .expect("Location", "/dir/")
        .end(done);
    });
  });

  describe("basic auth", () => {
    it("protects", (done) => {
      const opts = options();

      opts.protect = "username:passwords";

      const app = connect().use(superstatic(opts));

      request(app)
        .get("/")
        .expect(401)
        .expect("www-authenticate", 'Basic realm="Authorization Required"')
        .end(done);
    });
  });

  describe("custom headers", () => {
    it("with globs", (done) => {
      const opts = options();

      opts.config.headers = [
        {
          source: "/**/*.html",
          headers: [
            {
              key: "x-custom",
              value: "testing"
            }
          ]
        }
      ];

      const app = connect().use(superstatic(opts));

      request(app)
        .get("/dir/sub.html")
        .expect("x-custom", "testing")
        .end(done);
    });

    it("exact", (done) => {
      const opts = options();

      opts.config.headers = [
        {
          source: "/app.js",
          headers: [
            {
              key: "x-custom",
              value: "testing"
            }
          ]
        }
      ];

      const app = connect().use(superstatic(opts));

      request(app)
        .get("/app.js")
        .expect("x-custom", "testing")
        .end(done);
    });
  });

  xdescribe("environment variables", () => {
    it("json", (done) => {
      const opts = options();

      opts.env = {
        key: "value"
      };

      const app = connect().use(superstatic(opts));

      request(app)
        .get("/__/env.json")
        .expect({ key: "value" })
        .expect("Content-Type", "application/json; charset=utf-8")
        .end(done);
    });

    it("js", (done) => {
      const opts = options();

      opts.env = {
        key: "value"
      };

      const app = connect().use(superstatic(opts));

      request(app)
        .get("/__/env.js")
        .expect(200)
        .expect("Content-Type", "application/javascript; charset=utf-8")
        .end(done);
    });

    it("defaults to .env.json", (done) => {
      fs.outputFileSync(".env.json", '{"key":"value"}');

      const app = connect().use(superstatic());

      request(app)
        .get("/__/env.json")
        .expect({ key: "value" })
        .end((err) => {
          fs.remove(".env.json");
          done(err);
        });
    });

    it("serves env file, overriding static routing", (done) => {
      const opts = options();

      opts.env = {
        key: "value"
      };

      opts.config.rewrites = [
        {
          source: "**",
          destination: "/index.html"
        }
      ];

      const app = connect().use(superstatic(opts));

      request(app)
        .get("/__/env.json")
        .expect({ key: "value" })
        .expect("Content-Type", "application/json; charset=utf-8")
        .end(done);
    });
  });

  describe("custom routes", () => {
    it("serves file", (done) => {
      const opts = options();

      opts.config.rewrites = [
        {
          source: "/testing",
          destination: "/index.html"
        }
      ];

      const app = connect().use(superstatic(opts));

      request(app)
        .get("/testing")
        .expect(200)
        .expect("index")
        .expect("Content-Type", "text/html; charset=utf-8")
        .end(done);
    });

    it("serves file from custom route when clean urls are on and route matches an html as a clean url", (done) => {
      const opts = options();

      opts.config.cleanUrls = true;
      opts.config.rewrites = [
        {
          source: "/testing",
          destination: "/index.html"
        }
      ];

      const app = connect().use(superstatic(opts));

      request(app)
        .get("/testing")
        .expect(200)
        .expect("index")
        .expect("Content-Type", "text/html; charset=utf-8")
        .end(done);
    });

    it("serves static file when no matching route", (done) => {
      const opts = options();

      opts.config.rewrites = [
        {
          source: "/testing",
          destination: "/index.html"
        }
      ];

      const app = connect().use(superstatic(opts));

      request(app)
        .get("/test.html")
        .expect(200)
        .expect("test")
        .end(done);
    });

    it("serves with negation", (done) => {
      const opts = options();

      opts.config.rewrites = [
        {
          source: "!/no",
          destination: "/index.html"
        }
      ];

      const app = connect().use(superstatic(opts));

      request(app)
        .get("/no")
        .expect(404)
        .end(done);
    });

    it("serves file if url matches exact file path", (done) => {
      const opts = options();

      opts.config.rewrites = [
        {
          source: "**",
          destination: "/index.html"
        }
      ];

      const app = connect().use(superstatic(opts));

      request(app)
        .get("/test.html")
        .expect(200)
        .expect("test")
        .end(done);
    });
  });
});
