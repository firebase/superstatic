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

import superstatic from "../../src/";
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

describe("error page", () => {
  beforeEach(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
    await fs.mkdir(".tmp");
    await fs.writeFile(".tmp/default-error.html", "default error", "utf8");
    await fs.writeFile(".tmp/error.html", "config error", "utf8");
  });

  afterEach(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
  });

  it("from 404.html", async () => {
    await fs.writeFile(".tmp/404.html", "404.html error", "utf8");
    const opts = options();

    const app = connect().use(superstatic(opts));

    await request(app)
      .get("/does-not-exist")
      .expect(404)
      .expect("404.html error")
      .expect("Content-Type", "text/html; charset=utf-8");
  });

  it("from custom error page", async () => {
    const opts = options();
    opts.config.errorPage = "/error.html";

    const app = connect().use(superstatic(opts));

    await request(app)
      .get("/does-not-exist")
      .expect(404)
      .expect("config error")
      .expect("Content-Type", "text/html; charset=utf-8");
  });

  it("falls back to default when configured error page does not exist", async () => {
    const opts = options();

    opts.errorPage = ".tmp/default-error.html";

    const app = connect().use(superstatic(opts));

    await request(app)
      .get("/does-not-exist")
      .expect(404)
      .expect("default error")
      .expect("Content-Type", "text/html; charset=utf-8");
  });
});
