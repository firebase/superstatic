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

const helpers = require("../../helpers");
const headers = helpers.decorator(require("../../../src/middleware/headers"));
const connect = require("connect");
const request = require("supertest");

const defaultHeaders = [
  { source: "/test1", headers: [{ key: "Content-Type", value: "mime/type" }] },
  {
    source: "/test3",
    headers: [
      { key: "Access-Control-Allow-Origin", value: "https://www.example.net" },
    ],
  },
  {
    source: "/api/**",
    headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
  },
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

    void request(app)
      .get("/test1")
      .expect(200)
      .expect("Content-Type", "mime/type")
      .end(done);
  });

  it("serves custom access control headers", (done) => {
    const app = connect()
      .use(headers({ headers: defaultHeaders }))
      .use(okay);

    void request(app)
      .get("/test3")
      .expect(200)
      .expect("Access-Control-Allow-Origin", "https://www.example.net")
      .end(done);
  });

  it("uses routing rules", (done) => {
    const app = connect()
      .use(headers({ headers: defaultHeaders }))
      .use(okay);

    void request(app)
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
              headers: [{ key: "custom-header", value: "for testing" }],
            },
          ],
        }),
      )
      .use(okay);

    void request(app)
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
              headers: [{ key: "custom-header", value: "for testing" }],
            },
          ],
        }),
      )
      .use(okay);

    void request(app)
      .get("/resources/281.jpg")
      .expect(200)
      .expect("custom-header", "for testing")
      .end(done);
  });
});
