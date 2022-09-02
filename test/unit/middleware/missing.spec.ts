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

import * as connect from "connect";
import * as fs from "node:fs/promises";
import * as request from "supertest";

const fsProvider = require("../../../src/providers/fs"); // eslint-disable-line @typescript-eslint/no-var-requires
import * as helpers from "../../helpers";
import * as missingModule from "../../../src/middleware/missing";
import * as Responder from "../../../src/responder";

const missing = helpers.decorator(missingModule);

describe("custom not found", () => {
  const provider = fsProvider({
    public: ".tmp",
  });
  let app: connect.Server;

  beforeEach(async () => {
    await fs.mkdir(".tmp");
    await fs.writeFile(".tmp/not-found.html", "custom not found file");

    app = connect().use(
      (
        req: connect.IncomingMessage,
        res: any, // TODO(bkendall): extend http.ServerResponse.
        next: connect.NextFunction
      ): void => {
        res.superstatic = new Responder(req, res, { provider: provider });
        next();
      }
    );
  });

  afterEach(async () => {
    await fs.rm(".tmp", { recursive: true });
  });

  it("serves the file", async () => {
    app.use(missing({ errorPage: "/not-found.html" }, { provider: provider }));

    await request(app)
      .get("/anything")
      .expect(404)
      .expect("custom not found file");
  });

  it("skips middleware on file serve error", async () => {
    app
      .use(
        missing({ errorPage: "/does-not-exist.html" }, { provider: provider })
      )
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
        "my custom 404, in French"
      );
    });

    it("should resolve to the normal error page by default", async () => {
      app.use(
        missing(
          { errorPage: "/not-found.html", i18n: { root: "/i18n" } },
          { provider: provider }
        )
      );

      await request(app).get("/anything").expect(404, "custom not found file");
    });

    it("should resolve the i18n missing page if one was provided and matches", async () => {
      app.use(
        missing(
          { errorPage: "/not-found.html", i18n: { root: "/i18n" } },
          { provider: provider }
        )
      );

      await request(app)
        .get("/anything")
        .set("accept-language", "fr")
        .expect(404, "my custom 404, in French");
    });
  });
});
