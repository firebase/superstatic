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

import connect from "connect";
import { ServerResponse } from "node:http";
import request from "supertest";

import { Configuration } from "../../../src/config";
import protectModule from "../../../src/middleware/protect";
import * as helpers from "../../helpers";

const protect = helpers.decorator(protectModule);

function okay(req: connect.IncomingMessage, res: ServerResponse): void {
  res.writeHead(200);
  res.end("ok");
}

function basicHeader(credentials: string): string {
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

describe("protect middleware", () => {
  it("allows requests when no protect credentials are configured", async () => {
    const app = connect().use(protectModule()).use(okay);

    await request(app).get("/").expect(200, "ok");
  });

  it("authenticates valid credentials from spec.protect", async () => {
    const app = connect()
      .use(protect({}, { protect: "admin:secret" }))
      .use(okay);

    await request(app)
      .get("/")
      .expect(401)
      .expect("WWW-Authenticate", 'Basic realm="Authorization Required"');

    await request(app)
      .get("/")
      .set("Authorization", basicHeader("admin:wrong"))
      .expect(401);

    await request(app)
      .get("/")
      .set("Authorization", basicHeader("admin:secret"))
      .expect(200, "ok");
  });

  it("authenticates credentials from req.superstatic.protect", async () => {
    const app = connect()
      .use(protect({ protect: "admin:secret" }))
      .use(okay);

    await request(app).get("/").expect(401);

    await request(app)
      .get("/")
      .set("Authorization", basicHeader("admin:secret"))
      .expect(200, "ok");
  });

  it("falls back to req.superstatic.protect when spec.protect is empty string", async () => {
    const app = connect()
      .use((req, res, next) => {
        (
          req as connect.IncomingMessage & { superstatic?: Configuration }
        ).superstatic = { protect: "admin:secret" };
        next();
      })
      .use(protectModule({ protect: "" }))
      .use(okay);

    await request(app)
      .get("/")
      .expect(401)
      .expect("WWW-Authenticate", 'Basic realm="Authorization Required"');

    await request(app)
      .get("/")
      .set("Authorization", basicHeader("admin:secret"))
      .expect(200, "ok");
  });

  it("returns 401 without crashing when credentials lack a colon", async () => {
    const app = connect()
      .use(protect({}, { protect: "admin" }))
      .use(okay);

    await request(app)
      .get("/")
      .expect(401, "Unauthorized")
      .expect("WWW-Authenticate", 'Basic realm="Authorization Required"');

    await request(app)
      .get("/")
      .set("Authorization", basicHeader("admin:"))
      .expect(401, "Unauthorized");
  });

  it("supports passwords containing colons without leaking them in realm", async () => {
    const app = connect()
      .use(protect({}, { protect: "admin:pass:word" }))
      .use(okay);

    await request(app)
      .get("/")
      .expect(401)
      .expect("WWW-Authenticate", 'Basic realm="Authorization Required"');

    await request(app)
      .get("/")
      .set("Authorization", basicHeader("admin:pass"))
      .expect(401)
      .expect("WWW-Authenticate", 'Basic realm="Authorization Required"');

    await request(app)
      .get("/")
      .set("Authorization", basicHeader("admin:pass:word"))
      .expect(200, "ok");
  });
});
