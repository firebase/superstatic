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

const fs = require("node:fs/promises");
const request = require("supertest");
const connect = require("connect");
const { join } = require("path");
const { expect } = require("chai");

const notFound = require("../../../src/middleware/not-found");
const Responder = require("../../../src/responder");

describe("not found", () => {
  let app;

  beforeEach(async () => {
    await fs.mkdir(".tmp");
    await fs.writeFile(".tmp/not-found.html", "not found file", "utf8");

    app = connect().use((req, res, next) => {
      res.superstatic = new Responder(req, res, {
        provider: {},
      });
      next();
    });
  });

  afterEach(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
  });

  it("serves the file", (done) => {
    app.use(
      notFound({
        errorPage: ".tmp/not-found.html",
      }),
    );

    void request(app)
      .get("/anything")
      .expect(404)
      .expect("not found file")
      .end(done);
  });

  it("throws on file read error", () => {
    expect(() => {
      notFound({
        errorPage: ".tmp/does-not-exist.html",
      });
    }).to.throw("ENOENT");
  });

  it("caches for one hour", (done) => {
    app.use(
      notFound({
        errorPage: join(process.cwd(), ".tmp/not-found.html"),
      }),
    );

    void request(app)
      .get("/anything")
      .expect(404)
      .expect("Cache-Control", "public, max-age=3600")
      .end(done);
  });
});
