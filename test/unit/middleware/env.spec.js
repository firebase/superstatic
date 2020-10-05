/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const request = require("supertest");
const connect = require("connect");

const helpers = require("../../helpers");
const env = helpers.decorator(require("../../../lib/middleware/env"));
const Responder = require("../../../lib/responder");

describe("env", () => {
  let app;

  beforeEach(() => {
    app = connect().use((req, res, next) => {
      res.superstatic = new Responder(req, res, {
        provider: {}
      });
      next();
    });
  });

  it("serves json", (done) => {
    app.use(
      env({
        env: {
          key: "value"
        }
      })
    );

    request(app)
      .get("/__/env.json")
      .expect(200)
      .expect({
        key: "value"
      })
      .expect("content-type", "application/json; charset=utf-8")
      .end(done);
  });

  it("serves javascript", (done) => {
    app.use(
      env({
        env: {
          key: "value"
        }
      })
    );

    request(app)
      .get("/__/env.js")
      .expect(200)
      .expect("content-type", "application/javascript; charset=utf-8")
      .end(done);
  });
});
