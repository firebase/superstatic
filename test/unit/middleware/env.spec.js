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

const request = require("supertest");
const connect = require("connect");

const helpers = require("../../helpers");
const env = helpers.decorator(require("../../../src/middleware/env"));
const Responder = require("../../../src/responder");

describe("env", () => {
  let app;

  beforeEach(() => {
    app = connect().use((req, res, next) => {
      res.superstatic = new Responder(req, res, {
        provider: {},
      });
      next();
    });
  });

  it("serves json", (done) => {
    app.use(
      env({
        env: {
          key: "value",
        },
      })
    );

    request(app)
      .get("/__/env.json")
      .expect(200)
      .expect({
        key: "value",
      })
      .expect("content-type", "application/json; charset=utf-8")
      .end(done);
  });

  it("serves javascript", (done) => {
    app.use(
      env({
        env: {
          key: "value",
        },
      })
    );

    request(app)
      .get("/__/env.js")
      .expect(200)
      .expect("content-type", "application/javascript; charset=utf-8")
      .end(done);
  });
});
