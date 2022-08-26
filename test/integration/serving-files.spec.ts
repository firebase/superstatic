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

import * as fs from "node:fs/promises";
import { join } from "path";
import * as connect from "connect";
import * as request from "supertest";

import superstatic from "../../";
import { MiddlewareOptions } from "../../src/options";
import { Configuration } from "../../src/config";

function options(): MiddlewareOptions & { config: Configuration } {
  return {
    fallthrough: false,
    config: {
      public: ".tmp",
    },
  };
}

describe("serves", () => {
  beforeEach(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
    await fs.mkdir(".tmp");
    await fs.writeFile(".tmp/index.html", "index", "utf-8");
    await fs.writeFile(".tmp/test.html", "test", "utf-8");
    await fs.writeFile(".tmp/app.js", 'console.log("js")', "utf-8");
    await fs.mkdir(".tmp/dir");
    await fs.writeFile(".tmp/dir/index.html", "dir index", "utf-8");
    await fs.writeFile(".tmp/dir/sub.html", "dir sub", "utf-8");
  });

  afterEach(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
  });

  it("static file", async () => {
    const opts = options();

    const app = connect().use(superstatic(opts));

    return request(app)
      .get("/test.html")
      .expect(200)
      .expect("test")
      .expect("Content-Type", "text/html; charset=utf-8");
  });

  it("directory index file", async () => {
    const opts = options();

    const app = connect().use(superstatic(opts));

    return request(app)
      .get("/dir/")
      .expect(200)
      .expect("dir index")
      .expect("Content-Type", "text/html; charset=utf-8");
  });

  it("cannot access files above the root", async () => {
    const app = connect().use(superstatic(options()));

    return request(app).get("/../README.md").expect(404);
  });

  it("missing directory index", async () => {
    const opts = options();

    opts.config.public = "./";

    const app = connect().use(superstatic(opts));

    return request(app).get("/").expect(404);
  });

  it("javascript file", async () => {
    const opts = options();

    const app = connect().use(superstatic(opts));

    return request(app)
      .get("/app.js")
      .expect(200)
      .expect('console.log("js")')
      .expect("Content-Type", "application/javascript; charset=utf-8");
  });

  it("from custom current working directory", async () => {
    const opts = options();

    opts.cwd = join(process.cwd(), ".tmp");
    opts.config.public = "./dir";

    const app = connect().use(superstatic(opts));

    return request(app)
      .get("/index.html")
      .expect(200)
      .expect("dir index")
      .expect("Content-Type", "text/html; charset=utf-8");
  });

  describe("redirects", () => {
    const opts = options();

    opts.config.redirects = [
      { source: "/from", destination: "/to" },
      { source: "/fromCustom", destination: "/toCustom", type: 302 },
      { source: "/external", destination: "http://redirect.com" },
    ];

    const app = connect().use(superstatic(opts));

    it("301", async () => {
      return request(app).get("/from").expect(301).expect("Location", "/to");
    });

    it("custom", async () => {
      return request(app)
        .get("/fromCustom")
        .expect(302)
        .expect("Location", "/toCustom");
    });

    it("external urls", async () => {
      return request(app)
        .get("/external")
        .expect(301)
        .expect("Location", "http://redirect.com");
    });
  });

  describe("trailing slash", () => {
    xit("removes trailling slash for file", async () => {
      const app = connect().use(superstatic(options()));

      return request(app)
        .get("/test.html/")
        .expect(301)
        .expect("Location", "/test.html");
    });

    it("add trailing slash with a directory index file", async () => {
      const app = connect().use(superstatic(options()));

      return request(app).get("/dir").expect(301).expect("Location", "/dir/");
    });
  });

  describe("basic auth", () => {
    it("protects", async () => {
      const opts = options();

      opts.protect = "username:passwords";

      const app = connect().use(superstatic(opts));

      return request(app)
        .get("/")
        .expect(401)
        .expect("www-authenticate", 'Basic realm="Authorization Required"');
    });
  });

  describe("custom headers", () => {
    it("with globs", async () => {
      const opts = options();

      opts.config.headers = [
        {
          source: "/**/*.html",
          headers: [
            {
              key: "x-custom",
              value: "testing",
            },
          ],
        },
      ];

      const app = connect().use(superstatic(opts));

      return request(app).get("/dir/sub.html").expect("x-custom", "testing");
    });

    it("exact", async () => {
      const opts = options();

      opts.config.headers = [
        {
          source: "/app.js",
          headers: [
            {
              key: "x-custom",
              value: "testing",
            },
          ],
        },
      ];

      const app = connect().use(superstatic(opts));

      return request(app).get("/app.js").expect("x-custom", "testing");
    });
  });

  xdescribe("environment variables", () => {
    it("json", async () => {
      const opts = options();

      opts.env = {
        key: "value",
      };

      const app = connect().use(superstatic(opts));

      return request(app)
        .get("/__/env.json")
        .expect({ key: "value" })
        .expect("Content-Type", "application/json; charset=utf-8");
    });

    it("js", async () => {
      const opts = options();

      opts.env = {
        key: "value",
      };

      const app = connect().use(superstatic(opts));

      return request(app)
        .get("/__/env.js")
        .expect(200)
        .expect("Content-Type", "application/javascript; charset=utf-8");
    });

    it("defaults to .env.json", async () => {
      await fs.writeFile(".env.json", '{"key":"value"}', "utf8");

      const app = connect().use(superstatic());

      await request(app).get("/__/env.json").expect({ key: "value" });

      await fs.rm(".env.json");
    });

    it("serves env file, overriding static routing", async () => {
      const opts = options();

      opts.env = {
        key: "value",
      };

      opts.config.rewrites = [
        {
          source: "**",
          destination: "/index.html",
        },
      ];

      const app = connect().use(superstatic(opts));

      return request(app)
        .get("/__/env.json")
        .expect({ key: "value" })
        .expect("Content-Type", "application/json; charset=utf-8");
    });
  });

  describe("custom routes", () => {
    it("serves file", async () => {
      const opts = options();

      opts.config.rewrites = [
        {
          source: "/testing",
          destination: "/index.html",
        },
      ];

      const app = connect().use(superstatic(opts));

      return request(app)
        .get("/testing")
        .expect(200)
        .expect("index")
        .expect("Content-Type", "text/html; charset=utf-8");
    });

    it("serves file from custom route when clean urls are on and route matches an html as a clean url", async () => {
      const opts = options();

      opts.config.cleanUrls = true;
      opts.config.rewrites = [
        {
          source: "/testing",
          destination: "/index.html",
        },
      ];

      const app = connect().use(superstatic(opts));

      return request(app)
        .get("/testing")
        .expect(200)
        .expect("index")
        .expect("Content-Type", "text/html; charset=utf-8");
    });

    it("serves static file when no matching route", async () => {
      const opts = options();

      opts.config.rewrites = [
        {
          source: "/testing",
          destination: "/index.html",
        },
      ];

      const app = connect().use(superstatic(opts));

      return request(app).get("/test.html").expect(200).expect("test");
    });

    it("serves with negation", async () => {
      const opts = options();

      opts.config.rewrites = [
        {
          source: "!/no",
          destination: "/index.html",
        },
      ];

      const app = connect().use(superstatic(opts));

      return request(app).get("/no").expect(404);
    });

    it("serves file if url matches exact file path", async () => {
      const opts = options();

      opts.config.rewrites = [
        {
          source: "**",
          destination: "/index.html",
        },
      ];

      const app = connect().use(superstatic(opts));

      return request(app).get("/test.html").expect(200).expect("test");
    });
  });
});
