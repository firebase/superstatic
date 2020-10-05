/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const path = require("path");

const fs = require("fs-extra");
const request = require("supertest");
const expect = require("chai").expect;
const stdMocks = require("std-mocks");

const server = require("../../lib/server");

// NOTE: skipping these tests because of how
// supertest runs a connect server. The Superstatic
// server runs with a #listen() method, while the
// supertest runner uses the connect app object in
// a bare http.createServer() method. This
// doesn't work with how we are loading services.
describe.skip("server", () => {
  beforeEach(() => {
    fs.outputFileSync(".tmp/index.html", "index file content");
    fs.outputFileSync(".tmp/.env.json", '{"key": "value"}');
  });

  afterEach(() => {
    fs.removeSync(".tmp");
  });

  it("starts a server", (done) => {
    const app = server();

    request(app)
      .get("/")
      .end(done);
  });

  it("with config", (done) => {
    const app = server({
      config: {
        public: ".tmp"
      }
    });

    request(app)
      .get("/")
      .expect("index file content")
      .end(done);
  });

  it("with port", (done) => {
    const app = server({
      port: 9876
    });

    const s = app.listen(() => {
      expect(s.address().port).to.equal(9876);

      s.close(done);
    });
  });

  it("with hostname", (done) => {
    const app = server({
      hostname: "127.0.0.1"
    });

    const s = app.listen(() => {
      expect(s.address().address).to.equal("127.0.0.1");

      s.close(done);
    });
  });

  it("with host", (done) => {
    const app = server({
      host: "127.0.0.1"
    });

    const s = app.listen(() => {
      expect(s.address().address).to.equal("127.0.0.1");

      s.close(done);
    });
  });

  it("with debug", (done) => {
    let output;
    const app = server({
      debug: true
    });

    stdMocks.use();

    request(app)
      .get("/")
      .end(() => {
        stdMocks.restore();
        output = stdMocks.flush();

        expect(
          output.stdout.toString().indexOf('"GET / HTTP/1.1" 404')
        ).to.be.greaterThan(-1);
        done();
      });
  });

  it("with env filename", (done) => {
    const app = server({
      env: ".tmp/.env.json",
      config: {
        public: ".tmp"
      }
    });

    request(app)
      .get("/__/env.json")
      .expect({
        key: "value"
      })
      .end(done);
  });

  it("with env object", (done) => {
    const app = server({
      env: {
        type: "object"
      },
      config: {
        public: ".tmp"
      }
    });

    request(app)
      .get("/__/env.json")
      .expect({
        type: "object"
      })
      .end(done);
  });

  it("default error page", (done) => {
    const notFoundContent = fs
      .readFileSync(path.resolve(__dirname, "../../lib/assets/not_found.html"))
      .toString();

    const app = server();

    request(app)
      .get("/nope")
      .expect(404)
      .expect(notFoundContent)
      .end(done);
  });

  it("overriden default error page", (done) => {
    fs.outputFileSync(".tmp/error.html", "error page");

    const app = server({
      errorPage: ".tmp/error.html",
      config: {
        public: ".tmp"
      }
    });

    request(app)
      .get("/nope")
      .expect(404)
      .expect("error page")
      .end(done);
  });
});
