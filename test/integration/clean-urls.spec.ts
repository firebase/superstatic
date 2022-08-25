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
import * as connect from "connect";
import * as request from "supertest";

import superstatic from "../../";
import { MiddlewareOptions } from "../../src/options";
import { Configuration } from "../../src/config";

// config will always exist, so let's make typing nicer.
function options(): MiddlewareOptions & { config: Configuration } {
  return {
    config: {
      public: ".tmp",
    },
  };
}

describe("clean urls", () => {
  before(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
    await fs.mkdir(".tmp");
    await fs.mkdir(".tmp/dir");
    await fs.writeFile(".tmp/index.html", "index", "utf8");
    await fs.writeFile(".tmp/test.html", "test", "utf8");
    await fs.writeFile(".tmp/app.js", 'console.log("js")', "utf8");
    await fs.writeFile(".tmp/dir/index.html", "dir index", "utf8");
    await fs.writeFile(".tmp/dir/sub.html", "dir sub", "utf8");
  });

  after(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
  });

  it("not configured", async () => {
    const opts = options();

    const app = connect().use(superstatic(opts));

    await request(app).get("/test").expect(404);
  });

  it("redirects html file", async () => {
    const opts = options();

    opts.config.cleanUrls = true;

    const app = connect().use(superstatic(opts));

    await request(app)
      .get("/test.html")
      .expect(301)
      .expect("Location", "/test");
  });

  it("serves html file", async () => {
    const opts = options();

    opts.config.cleanUrls = true;

    const app = connect().use(superstatic(opts));

    await request(app).get("/test").expect(200).expect("test");
  });

  it("redirects using globs", async () => {
    const opts = options();

    opts.config.cleanUrls = ["/*.html"];

    const app = connect().use(superstatic(opts));

    await request(app)
      .get("/test.html")
      .expect(301)
      .expect("Location", "/test");
  });

  it("serves html file using globs", async () => {
    const opts = options();

    opts.config.cleanUrls = ["*.html"];

    const app = connect().use(superstatic(opts));

    await request(app).get("/test").expect(200).expect("test");
  });
});
