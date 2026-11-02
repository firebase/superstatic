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
import * as path from "node:path";
import connect from "connect";
import request from "supertest";
import { expect } from "chai";

import notFound from "../../../src/middleware/not-found";

describe("not found", () => {
  let app: connect.Server;

  beforeEach(async () => {
    await fs.mkdir(".tmp", { recursive: true });
    await fs.writeFile(".tmp/not-found.html", "not found file", "utf8");

    app = connect();
  });

  afterEach(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
  });

  it("serves the file", async () => {
    app.use(
      notFound({
        errorPage: ".tmp/not-found.html",
      }),
    );

    await request(app)
      .get("/anything")
      .expect(404)
      .expect("Content-Type", "text/html; charset=utf-8")
      .expect("not found file");
  });

  it("serves the default error page when spec is omitted", async () => {
    app.use(notFound());

    await request(app)
      .get("/anything")
      .expect(404)
      .expect("Content-Type", "text/html; charset=utf-8")
      .expect(/Page Not Found/);
  });

  it("throws on file read error", () => {
    expect(() => {
      notFound({
        errorPage: ".tmp/does-not-exist.html",
      });
    }).to.throw("ENOENT");
  });

  it("caches for one hour", async () => {
    app.use(
      notFound({
        errorPage: path.join(process.cwd(), ".tmp/not-found.html"),
      }),
    );

    await request(app)
      .get("/anything")
      .expect(404)
      .expect("Cache-Control", "public, max-age=3600");
  });
});
