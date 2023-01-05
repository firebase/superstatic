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

function options(): MiddlewareOptions & { config: Configuration } {
  return {
    fallthrough: false,
    config: {
      public: ".tmp",
      i18n: { root: "intl" },
    },
  };
}

describe("i18n resolution", () => {
  before(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
    await fs.mkdir(".tmp");
    await fs.writeFile(".tmp/index.html", "normal index", "utf8");
    await fs.writeFile(".tmp/404.html", "normal 404", "utf8");
    await fs.mkdir(".tmp/intl");
    await fs.mkdir(".tmp/intl/fr");
    await fs.writeFile(".tmp/intl/fr/index.html", "french index", "utf8");
    await fs.writeFile(".tmp/intl/fr/404.html", "french 404", "utf8");
  });

  after(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
  });

  it("index.html", async () => {
    const opts = options();

    const app = connect().use(superstatic(opts));

    await request(app).get("/").expect(200, "normal index");
  });

  it("index.html with language", async () => {
    const opts = options();

    const app = connect().use(superstatic(opts));

    await request(app)
      .get("/")
      .set("accept-language", "fr")
      .expect(200, "french index");
  });

  it("index.html with unknown language", async () => {
    const opts = options();

    const app = connect().use(superstatic(opts));

    await request(app)
      .get("/")
      .set("accept-language", "de")
      .expect(200, "normal index");
  });

  it("an unknown file", async () => {
    const opts = options();

    const app = connect().use(superstatic(opts));

    await request(app).get("/nope").expect(404, "normal 404");
  });

  it("an unknown file with language", async () => {
    const opts = options();

    const app = connect().use(superstatic(opts));

    await request(app)
      .get("/nope")
      .set("accept-language", "fr")
      .expect(404, "french 404");
  });
});
