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

const path = require("path");

const fs = require("node:fs/promises");
const request = require("supertest");
const expect = require("chai").expect;
const stdMocks = require("std-mocks");

const server = require("../../src/server");

// NOTE: skipping these tests because of how
// supertest runs a connect server. The Superstatic
// server runs with a #listen() method, while the
// supertest runner uses the connect app object in
// a bare http.createServer() method. This
// doesn't work with how we are loading services.
describe.skip("server", () => {
  beforeEach(async () => {
    await fs.mkdir(".tmp");
    await fs.writeFile(".tmp/index.html", "index file content");
    await fs.writeFile(".tmp/.env.json", '{"key": "value"}');
  });

  afterEach(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
  });

  it("starts a server", (done) => {
    const app = server();

    void request(app).get("/").end(done);
  });

  it("with config", (done) => {
    const app = server({
      config: {
        public: ".tmp",
      },
    });

    void request(app).get("/").expect("index file content").end(done);
  });

  it("with port", (done) => {
    const app = server({
      port: 9876,
    });

    const s = app.listen(() => {
      expect(s.address().port).to.equal(9876);

      s.close(done);
    });
  });

  it("with hostname", (done) => {
    const app = server({
      hostname: "127.0.0.1",
    });

    const s = app.listen(() => {
      expect(s.address().address).to.equal("127.0.0.1");

      s.close(done);
    });
  });

  it("with host", (done) => {
    const app = server({
      host: "127.0.0.1",
    });

    const s = app.listen(() => {
      expect(s.address().address).to.equal("127.0.0.1");

      s.close(done);
    });
  });

  it("with debug", (done) => {
    let output;
    const app = server({
      debug: true,
    });

    stdMocks.use();

    void request(app)
      .get("/")
      .end(() => {
        stdMocks.restore();
        output = stdMocks.flush();

        expect(
          output.stdout.toString().indexOf('"GET / HTTP/1.1" 404'),
        ).to.be.greaterThan(-1);
        done();
      });
  });

  it("with env filename", (done) => {
    const app = server({
      env: ".tmp/.env.json",
      config: {
        public: ".tmp",
      },
    });

    void request(app)
      .get("/__/env.json")
      .expect({
        key: "value",
      })
      .end(done);
  });

  it("with env object", (done) => {
    const app = server({
      env: {
        type: "object",
      },
      config: {
        public: ".tmp",
      },
    });

    void request(app)
      .get("/__/env.json")
      .expect({
        type: "object",
      })
      .end(done);
  });

  it("default error page", async () => {
    const p = path.resolve(__dirname, "../../templates/assets/not_found.html");
    const notFoundContent = await fs.readFile(p, "utf8");

    const app = server();

    return void request(app).get("/nope").expect(404).expect(notFoundContent);
  });

  it("overriden default error page", async () => {
    await fs.writeFile(".tmp/error.html", "error page");

    const app = server({
      errorPage: ".tmp/error.html",
      config: {
        public: ".tmp",
      },
    });

    return void request(app).get("/nope").expect(404).expect("error page");
  });
});
