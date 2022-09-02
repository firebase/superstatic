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

import * as fs from "node:fs/promises";
import * as request from "supertest";
import * as connect from "connect";

import * as helpers from "../../helpers";
import * as rewritesPkg from "../../../src/middleware/rewrites";
const fsProvider = require("../../../src/providers/fs"); // eslint-disable-line @typescript-eslint/no-var-requires
import * as Responder from "../../../src/responder";

const rewrites = helpers.decorator(rewritesPkg);

describe("static router", () => {
  const provider = fsProvider({
    public: ".tmp",
  });
  let app: connect.Server;

  beforeEach(async () => {
    await fs.mkdir(".tmp", { recursive: true });
    await fs.writeFile(".tmp/index.html", "index", "utf8");

    app = connect().use((req, res: any, next) => {
      res.superstatic = new Responder(req, res, { provider });
      next();
    });
  });

  afterEach(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
  });

  it("serves a route", async () => {
    app.use(
      rewrites({
        rewrites: [
          {
            source: "/my-route",
            destination: "/index.html",
          },
        ],
      })
    );

    await request(app)
      .get("/my-route")
      .expect(200)
      .expect("index")
      .expect("content-type", "text/html; charset=utf-8");
  });

  it("serves a route with a glob", async () => {
    app.use(
      rewrites({
        rewrites: [
          {
            source: "**",
            destination: "/index.html",
          },
        ],
      })
    );

    await request(app)
      .get("/my-route")
      .expect(200)
      .expect("index")
      .expect("content-type", "text/html; charset=utf-8");
  });

  it("serves a route with a regex", async () => {
    app.use(
      rewrites({
        rewrites: [
          {
            regex: ".*",
            destination: "/index.html",
          },
        ],
      })
    );

    await request(app)
      .get("/my-route")
      .expect(200)
      .expect("index")
      .expect("content-type", "text/html; charset=utf-8");
  });

  it("serves a route with an extension via a glob", async () => {
    app.use(
      rewrites({
        rewrites: [
          {
            source: "**",
            destination: "/index.html",
          },
        ],
      })
    );

    await request(app)
      .get("/my-route.py")
      .expect(200)
      .expect("index")
      .expect("content-type", "text/html; charset=utf-8");
  });

  it("serves a route with an extension via a regex", async () => {
    app.use(
      rewrites({
        rewrites: [
          {
            regex: "/\\w+\\.py",
            destination: "/index.html",
          },
        ],
      })
    );

    await request(app)
      .get("/myroute.py")
      .expect(200)
      .expect("index")
      .expect("content-type", "text/html; charset=utf-8");
  });

  it("serves a negated route", async () => {
    app.use(
      rewrites({
        rewrites: [
          {
            source: "!/no",
            destination: "/index.html",
          },
        ],
      })
    );

    await request(app)
      .get("/my-route")
      .expect(200)
      .expect("index")
      .expect("content-type", "text/html; charset=utf-8");
  });

  it("skips if no match is found", async () => {
    app.use(
      rewrites({
        rewrites: [
          {
            source: "/skip",
            destination: "/index.html",
          },
        ],
      })
    );

    await request(app).get("/hi").expect(404);
  });

  it("serves the mime type of the rewritten file", async () => {
    app.use(
      rewrites({
        rewrites: [
          {
            source: "**",
            destination: "/index.html",
          },
        ],
      })
    );

    await request(app)
      .get("/index.js")
      .expect("content-type", "text/html; charset=utf-8");
  });

  describe("uses first match", () => {
    beforeEach(async () => {
      await fs.mkdir(".tmp/admin", { recursive: true });
      await fs.writeFile(".tmp/admin/index.html", "admin index", "utf8");

      app.use(
        rewrites({
          rewrites: [
            { source: "/admin/**", destination: "/admin/index.html" },
            { source: "/something/**", destination: "/something/indexf.html" },
            { source: "**", destination: "/index.html" },
          ],
        })
      );
    });

    it("first route with 1 depth route", async () => {
      await request(app)
        .get("/admin/anything")
        .expect(200)
        .expect("admin index");
    });

    it("first route with 2 depth route", async () => {
      await request(app)
        .get("/admin/anything/else")
        .expect(200)
        .expect("admin index");
    });

    it("second route", async () => {
      await request(app).get("/anything").expect(200).expect("index");
    });
  });

  describe("a relative rewrite", () => {
    beforeEach(() => {
      app.use(
        rewrites({
          rewrites: [{ source: "**", destination: "index.html" }],
        })
      );
    });

    it("should never work", async () => {
      await request(app).get("/about").expect(404);
    });
  });
});
