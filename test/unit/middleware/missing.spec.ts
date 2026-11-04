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
import * as fs from "node:fs/promises";
import { ServerResponse } from "node:http";
import { createRequire } from "node:module";
import request from "supertest";

import { Configuration } from "../../../src/config";
import missingModule from "../../../src/middleware/missing";
import Responder from "../../../src/responder";
import * as helpers from "../../helpers";

type ProviderFactory = (options: { public: string }) => unknown;
type ResponderConstructor = new (
  req: connect.IncomingMessage,
  res: ServerResponse,
  options: { provider: unknown },
) => Responder;

const requireModule: (id: string) => unknown = createRequire(__filename);
const fsProvider = requireModule(
  "../../../src/providers/fs",
) as ProviderFactory;
const ResponderClass = Responder as unknown as ResponderConstructor;

const missing = helpers.decorator(missingModule);

describe("custom not found", () => {
  const provider = fsProvider({
    public: ".tmp",
  });
  let app: connect.Server;

  beforeEach(async () => {
    await fs.mkdir(".tmp", { recursive: true });
    await fs.writeFile(".tmp/not-found.html", "custom not found file");

    app = connect().use(
      (
        req: connect.IncomingMessage,
        res: ServerResponse & { superstatic?: Responder },
        next: connect.NextFunction,
      ): void => {
        res.superstatic = new ResponderClass(req, res, { provider });
        next();
      },
    );
  });

  afterEach(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
  });

  it("serves the file", async () => {
    app.use(missing({ errorPage: "/not-found.html" }, { provider }));

    await request(app)
      .get("/anything")
      .expect(404)
      .expect("custom not found file");
  });

  it("defaults to /404.html when errorPage is not configured", async () => {
    await fs.writeFile(".tmp/404.html", "default 404 file");
    app.use(missing({}, { provider }));

    await request(app).get("/anything").expect(404).expect("default 404 file");
  });

  it("falls back to spec.errorPage content when configured errorPage is missing", async () => {
    await fs.writeFile(".tmp/fallback-error.html", "fallback error content");
    app.use(
      missing(
        { errorPage: "/does-not-exist.html" },
        { errorPage: ".tmp/fallback-error.html", provider },
      ),
    );

    await request(app)
      .get("/anything")
      .expect(404)
      .expect("fallback error content");
  });

  it("applies configured custom headers and allowedHeaders to the error page", async () => {
    app.use(
      missing(
        {
          errorPage: "/not-found.html",
          headers: [
            {
              source: "/not-found.html",
              headers: [
                { key: "X-Error-Header", value: "applied" },
                { key: "X-Disallowed", value: "ignored" },
              ],
            },
          ],
        },
        { allowedHeaders: ["x-error-header"], provider },
      ),
    );

    await request(app)
      .get("/anything")
      .expect(404)
      .expect("X-Error-Header", "applied")
      .expect("custom not found file")
      .expect((res) => {
        expect(res.headers["x-disallowed"]).to.equal(undefined);
      });
  });

  it("applies headers to decoded non-ASCII errorPage paths", async () => {
    await fs.writeFile(".tmp/äää.html", "unicode 404");
    app.use(
      missing(
        {
          errorPage: "/äää.html",
          headers: [
            {
              source: "/äää.html",
              headers: [{ key: "X-Unicode-404", value: "ok" }],
            },
          ],
        },
        { provider },
      ),
    );

    await request(app)
      .get("/missing")
      .expect(404)
      .expect("X-Unicode-404", "ok")
      .expect("unicode 404");
  });

  it("supports direct invocation with default spec", async () => {
    app.use((req, res, next) => {
      (
        req as connect.IncomingMessage & { superstatic?: Configuration }
      ).superstatic = {
        errorPage: "/not-found.html",
      };
      next();
    });
    app.use(missingModule());

    await request(app)
      .get("/anything")
      .expect(404)
      .expect("custom not found file");
  });

  it("skips middleware on file serve error", async () => {
    app
      .use(missing({ errorPage: "/does-not-exist.html" }, { provider }))
      .use((req, res) => {
        res.end("does not exist");
      });

    await request(app).get("/anything").expect("does not exist");
  });

  describe("with i18n files", () => {
    beforeEach(async () => {
      await fs.mkdir(".tmp/i18n/fr", { recursive: true });
      await fs.writeFile(
        ".tmp/i18n/fr/not-found.html",
        "my custom 404, in French",
      );
    });

    it("should resolve to the normal error page by default", async () => {
      app.use(
        missing(
          { errorPage: "/not-found.html", i18n: { root: "/i18n" } },
          { provider },
        ),
      );

      await request(app).get("/anything").expect(404, "custom not found file");
    });

    it("should resolve the i18n missing page if one was provided and matches", async () => {
      app.use(
        missing(
          { errorPage: "/not-found.html", i18n: { root: "/i18n" } },
          { provider },
        ),
      );

      await request(app)
        .get("/anything")
        .set("accept-language", "fr")
        .expect(404, "my custom 404, in French");
    });
  });
});
