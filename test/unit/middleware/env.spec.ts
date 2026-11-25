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
import * as fs from "node:fs";
import { ServerResponse } from "node:http";
import * as path from "node:path";
import request from "supertest";

import rawEnv from "../../../src/middleware/env";
import { SuperstaticRequest } from "../../../src/options";
import Responder from "../../../src/responder";
import * as helpers from "../../helpers";

const env = helpers.decorator(rawEnv);

describe("env", () => {
  let app: connect.Server;

  beforeEach(() => {
    app = connect().use(
      (
        req: connect.IncomingMessage,
        res: ServerResponse & { superstatic?: Responder },
        next: connect.NextFunction,
      ) => {
        res.superstatic = new Responder(req, res);
        next();
      },
    );
  });

  it("serves json", async () => {
    app.use(
      env({
        env: {
          key: "value",
        },
      }),
    );

    await request(app)
      .get("/__/env.json")
      .expect(200)
      .expect({
        key: "value",
      })
      .expect("content-type", "application/json; charset=utf-8");
  });

  it("serves javascript", async () => {
    const expectedBody = fs
      .readFileSync(
        path.resolve(__dirname, "../../../templates/env.js.template"),
        "utf8",
      )
      .replace("{{ENV}}", JSON.stringify({ key: "value" }));

    app.use(
      env({
        env: {
          key: "value",
        },
      }),
    );

    await request(app)
      .get("/__/env.js")
      .expect(200)
      .expect("content-type", "application/javascript; charset=utf-8")
      .expect(expectedBody);
  });

  it("does not call next after serving env json", async () => {
    app.use(
      env({
        env: {
          key: "value",
        },
      }),
    );
    app.use((_req, _res, next) => {
      next(new Error("next() should not have been called"));
    });

    await request(app).get("/__/env.json").expect(200).expect({
      key: "value",
    });
  });

  it("does not call next after serving env js", async () => {
    app.use(
      env({
        env: {
          key: "value",
        },
      }),
    );
    app.use((_req, _res, next) => {
      next(new Error("next() should not have been called"));
    });

    await request(app).get("/__/env.js").expect(200);
  });

  it("uses request env config when spec is omitted", async () => {
    app.use((req, _res, next) => {
      (req as SuperstaticRequest).superstatic = {
        env: {
          key: "value",
        },
      };
      next();
    });
    app.use(rawEnv());

    await request(app).get("/__/env.json").expect(200).expect({
      key: "value",
    });
  });

  it("calls next cleanly when mounted standalone without req.superstatic", async () => {
    const standalone = connect();
    standalone.use(rawEnv());
    standalone.use((_req, res) => {
      res.statusCode = 204;
      res.end();
    });

    await request(standalone).get("/__/env.json").expect(204);
  });

  it("serves env json when mounted standalone with spec.env", async () => {
    const standalone = connect();
    standalone.use(rawEnv({ env: { key: "value" } }));

    await request(standalone)
      .get("/__/env.json")
      .expect(200)
      .expect("content-type", "application/json; charset=utf-8")
      .expect({ key: "value" });
  });

  it("serves env js when mounted standalone with spec.env", async () => {
    const expectedBody = fs
      .readFileSync(
        path.resolve(__dirname, "../../../templates/env.js.template"),
        "utf8",
      )
      .replace("{{ENV}}", JSON.stringify({ key: "value" }));

    const standalone = connect();
    standalone.use(rawEnv({ env: { key: "value" } }));

    await request(standalone)
      .get("/__/env.js")
      .expect(200)
      .expect("content-type", "application/javascript; charset=utf-8")
      .expect(expectedBody);
  });
});
