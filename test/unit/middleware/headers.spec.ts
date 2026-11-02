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

import { expect } from "chai";
import connect from "connect";
import { ServerResponse } from "node:http";
import request from "supertest";

import { Header } from "../../../src/config";
import headersModule from "../../../src/middleware/headers";
import { SuperstaticRequest } from "../../../src/options";
import * as helpers from "../../helpers";

const headers = helpers.decorator(headersModule);

const defaultHeaders: Header[] = [
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

function okay(req: connect.IncomingMessage, res: ServerResponse): void {
  res.writeHead(200);
  res.end();
}

describe("cors middleware", () => {
  it("serves custom content types", async () => {
    const app = connect()
      .use(headers({ headers: defaultHeaders }))
      .use(okay);

    await request(app)
      .get("/test1")
      .expect(200)
      .expect("Content-Type", "mime/type");
  });

  it("serves custom access control headers", async () => {
    const app = connect()
      .use(headers({ headers: defaultHeaders }))
      .use(okay);

    await request(app)
      .get("/test3")
      .expect(200)
      .expect("Access-Control-Allow-Origin", "https://www.example.net");
  });

  it("uses routing rules", async () => {
    const app = connect()
      .use(headers({ headers: defaultHeaders }))
      .use(okay);

    await request(app)
      .get("/api/whatever/you/wish")
      .expect(200)
      .expect("Access-Control-Allow-Origin", "*");
  });

  it("uses glob negation to set headers", async () => {
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

    await request(app)
      .get("/something")
      .expect(200)
      .expect("custom-header", "for testing");
  });

  it("uses regular expressions to set headers", async () => {
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

    await request(app)
      .get("/resources/281.jpg")
      .expect(200)
      .expect("custom-header", "for testing");
  });

  it("filters headers using allowedHeaders", async () => {
    const app = connect()
      .use(
        headers(
          {
            headers: [
              {
                source: "/filtered",
                headers: [
                  { key: "X-Allowed", value: "yes" },
                  { key: "X-Blocked", value: "no" },
                ],
              },
            ],
          },
          { allowedHeaders: ["x-allowed"] },
        ),
      )
      .use(okay);

    await request(app)
      .get("/filtered")
      .expect(200)
      .expect("X-Allowed", "yes")
      .expect((res) => {
        expect(res.headers["x-blocked"]).to.equal(undefined);
      });
  });

  it("normalizes sources without a leading slash", async () => {
    const app = connect()
      .use(
        headers({
          headers: [
            {
              source: "unslashed",
              headers: [{ key: "X-Normalized", value: "ok" }],
            },
          ],
        }),
      )
      .use(okay);

    await request(app)
      .get("/unslashed")
      .expect(200)
      .expect("X-Normalized", "ok");
  });

  it("skips when headers config is not set", async () => {
    const app = connect().use(headers({})).use(okay);

    await request(app)
      .get("/test1")
      .expect(200)
      .expect((res) => {
        expect(res.headers["content-type"]).to.equal(undefined);
      });
  });

  it("supports direct invocation with default spec", async () => {
    const app = connect()
      .use((req, res, next) => {
        (req as SuperstaticRequest).superstatic = { headers: defaultHeaders };
        next();
      })
      .use(headersModule())
      .use(okay);

    await request(app)
      .get("/test1")
      .expect(200)
      .expect("Content-Type", "mime/type");
  });
});
