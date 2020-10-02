/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const helpers = require("../../helpers");
const headers = helpers.decorator(require("../../../lib/middleware/headers"));
const connect = require("connect");
const request = require("supertest");

const defaultHeaders = [
  { source: "/test1", headers: [{ key: "Content-Type", value: "mime/type" }] },
  {
    source: "/test3",
    headers: [
      { key: "Access-Control-Allow-Origin", value: "https://www.example.net" }
    ]
  },
  {
    source: "/api/**",
    headers: [{ key: "Access-Control-Allow-Origin", value: "*" }]
  }
];

function okay(req, res) {
  res.writeHead(200);
  res.end();
}

describe("cors middleware", () => {
  it("serves custom content types", (done) => {
    const app = connect()
      .use(headers({ headers: defaultHeaders }))
      .use(okay);

    request(app)
      .get("/test1")
      .expect(200)
      .expect("Content-Type", "mime/type")
      .end(done);
  });

  it("serves custom access control headers", (done) => {
    const app = connect()
      .use(headers({ headers: defaultHeaders }))
      .use(okay);

    request(app)
      .get("/test3")
      .expect(200)
      .expect("Access-Control-Allow-Origin", "https://www.example.net")
      .end(done);
  });

  it("uses routing rules", (done) => {
    const app = connect()
      .use(headers({ headers: defaultHeaders }))
      .use(okay);

    request(app)
      .get("/api/whatever/you/wish")
      .expect(200)
      .expect("Access-Control-Allow-Origin", "*")
      .end(done);
  });

  it("uses glob negation to set headers", (done) => {
    const app = connect()
      .use(
        headers({
          headers: [
            {
              source: "!/anything/**",
              headers: [{ key: "custom-header", value: "for testing" }]
            }
          ]
        })
      )
      .use(okay);

    request(app)
      .get("/something")
      .expect(200)
      .expect("custom-header", "for testing")
      .end(done);
  });

  it("uses regular expressions to set headers", (done) => {
    const app = connect()
      .use(
        headers({
          headers: [
            {
              regex: "/resources/\\d+\\.jpg",
              headers: [{ key: "custom-header", value: "for testing" }]
            }
          ]
        })
      )
      .use(okay);

    request(app)
      .get("/resources/281.jpg")
      .expect(200)
      .expect("custom-header", "for testing")
      .end(done);
  });
});
