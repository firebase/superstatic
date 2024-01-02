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
import { expect } from "chai";
import * as request from "supertest";
import * as connect from "connect";
import { ServerResponse } from "node:http";

import * as helpers from "../../helpers";
import * as filesPkg from "../../../src/middleware/files";
const fsProvider = require("../../../src/providers/fs"); // eslint-disable-line @typescript-eslint/no-var-requires
import * as Responder from "../../../src/responder";

const files = helpers.decorator(filesPkg);

describe("i18n", () => {
  const provider = fsProvider({ public: ".tmp" });
  let app: connect.Server;

  beforeEach(async () => {
    await fs.mkdir(".tmp", { recursive: true });
    await fs.writeFile(".tmp/foo.html", "foo.html content", "utf8");
    await fs.mkdir(".tmp/foo", { recursive: true });
    await fs.writeFile(".tmp/foo/index.html", "foo/index.html content", "utf8");
    await fs.writeFile(".tmp/foo/bar.html", "foo/bar.html content", "utf8");
    await fs.mkdir(".tmp/intl/es", { recursive: true });
    await fs.writeFile(".tmp/intl/es/index.html", "hola", "utf8");
    await fs.mkdir(".tmp/intl/fr", { recursive: true });
    await fs.writeFile(".tmp/intl/fr/index.html", "French Index!", "utf8");
    await fs.mkdir(".tmp/intl/jp_ALL", { recursive: true });
    await fs.writeFile(".tmp/intl/jp_ALL/other.html", "Japanese!", "utf8");
    await fs.mkdir(".tmp/intl/fr_ca", { recursive: true });
    await fs.writeFile(".tmp/intl/fr_ca/index.html", "French CA!", "utf8");
    await fs.mkdir(".tmp/intl/ALL_ca", { recursive: true });
    await fs.writeFile(".tmp/intl/ALL_ca/index.html", "Oh Canada", "utf8");
    await fs.writeFile(".tmp/intl/ALL_ca/hockey.html", "Only Canada", "utf8");

    app = connect().use(
      (req, res: ServerResponse & { superstatic?: Responder }, next) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        res.superstatic = new Responder(req, res, { provider });
        next();
      },
    );
  });

  afterEach(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
  });

  it("should resolve i18n content by accept-language", async () => {
    app.use(files({ i18n: { root: "/intl" } }, { provider }));

    await request(app)
      .get("/")
      .set("accept-language", "es")
      .expect(200, "hola");
  });

  it("should resolve default files if nothing is provided", async () => {
    app.use(files({ i18n: { root: "/intl" } }, { provider }));

    await request(app)
      .get("/foo.html")
      .set("accept-language", "jp")
      .expect(200, "foo.html content");
  });

  it("should resolve i18n content by x-country-code", async () => {
    app.use(files({ i18n: { root: "/intl" } }, { provider }));

    await request(app)
      .get("/")
      .set("x-country-code", "ca")
      .expect(200, "Oh Canada");
  });

  it("should not show i18n content for other countries", async () => {
    app.use(files({ i18n: { root: "/intl" } }, { provider }));

    await request(app)
      .get("/hockey.html")
      .set("x-country-code", "jp")
      .expect(404);
  });

  it("should allow i18n content specific to a country", async () => {
    app.use(files({ i18n: { root: "/intl" } }, { provider }));

    await request(app)
      .get("/hockey.html")
      .set("x-country-code", "ca")
      .expect(200, "Only Canada");
  });

  it("should resolve i18n content by accept-language and x-country-code", async () => {
    app.use(files({ i18n: { root: "/intl" } }, { provider }));

    await request(app)
      .get("/")
      .set("accept-language", "fr")
      .set("x-country-code", "ca")
      .expect(200, "French CA!");
  });

  it("should override the content using cookies for location", async () => {
    app.use(files({ i18n: { root: "/intl" } }, { provider }));

    await request(app)
      .get("/")
      .set("accept-language", "es")
      .set("cookie", "firebase-language-override=fr")
      .expect(200, "French Index!");
  });

  it("should override the content using cookies for location and country", async () => {
    app.use(files({ i18n: { root: "/intl" } }, { provider }));

    await request(app)
      .get("/")
      .set("accept-language", "en")
      .set(
        "cookie",
        "firebase-language-override=fr; firebase-country-override=ca",
      )
      .expect(200, "French CA!");
  });

  it("should allow i18n resolution by language with _ALL", async () => {
    app.use(files({ i18n: { root: "/intl" } }, { provider }));

    await request(app)
      .get("/other.html")
      .set("accept-language", "jp")
      .expect(200, "Japanese!");
  });
});

describe("static server with trailing slash customization", () => {
  const provider = fsProvider({
    public: ".tmp",
  });
  let app: connect.Server;

  beforeEach(async () => {
    await fs.mkdir(".tmp", { recursive: true });
    await fs.writeFile(".tmp/foo.html", "foo.html content", "utf8");
    await fs.mkdir(".tmp/foo", { recursive: true });
    await fs.writeFile(".tmp/foo/index.html", "foo/index.html content", "utf8");
    await fs.writeFile(".tmp/foo/bar.html", "foo/bar.html content", "utf8");

    app = connect().use(
      (req, res: ServerResponse & { superstatic?: Responder }, next) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        res.superstatic = new Responder(req, res, { provider });
        next();
      },
    );
  });

  afterEach(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
  });

  it("serves html file", async () => {
    app.use(files({}, { provider: provider }));

    await request(app)
      .get("/foo.html")
      .expect(200)
      .expect("foo.html content")
      .expect("content-type", "text/html; charset=utf-8");
  });

  it("serves html file with unicode name", async () => {
    await fs.writeFile(".tmp/äää.html", "test", "utf8");

    app.use(files({}, { provider: provider }));

    await request(app)
      .get("/äää.html")
      .expect(200)
      .expect("test")
      .expect("content-type", "text/html; charset=utf-8");
  });

  it("serves css file", async () => {
    await fs.writeFile(".tmp/style.css", "body {}", "utf8");

    app.use(files({}, { provider: provider }));

    await request(app)
      .get("/style.css")
      .expect(200)
      .expect("body {}")
      .expect("content-type", "text/css; charset=utf-8");
  });

  it("serves a directory index file", async () => {
    await fs.writeFile(".tmp/index.html", "test", "utf8");

    app.use(files({}, { provider: provider }));

    await request(app)
      .get("/")
      .expect(200)
      .expect("test")
      .expect("content-type", "text/html; charset=utf-8");
  });

  it("serves a file with query parameters", async () => {
    await fs.writeFile(".tmp/superstatic.html", "test", "utf8");

    app.use(files({}, { provider: provider }));

    await request(app)
      .get("/superstatic.html?key=value")
      .expect(200)
      .expect("test");
  });

  it("does not redirect the root url because of the trailing slash", async () => {
    await fs.writeFile(".tmp/index.html", "an actual index", "utf8");

    app.use(files({}, { provider: provider }));

    await request(app).get("/").expect(200).expect("an actual index");
  });

  it("does not redirect for directory index files", async () => {
    app.use(files({}, { provider: provider }));

    await request(app)
      .get("/foo/")
      .expect(200)
      .expect("foo/index.html content");
  });

  it("function() directory index to have a trailing slash", async () => {
    app.use(files({}, { provider: provider }));

    await request(app)
      .get("/foo")
      .expect((res) => {
        expect(res.headers.location).to.equal("/foo/");
      })
      .expect(301);
  });

  it("preserves query parameters and slash on subdirectory directory index redirect", async () => {
    app.use(files({}, { provider: provider }));

    await request(app)
      .get("/foo?query=params")
      .expect((req) => {
        expect(req.headers.location).to.equal("/foo/?query=params");
      })
      .expect(301);
  });

  describe("force trailing slash", () => {
    it("adds slash to url with no extension", async () => {
      app.use(files({ trailingSlash: true }, { provider: provider }));

      await request(app).get("/foo").expect(301).expect("Location", "/foo/");
    });
  });

  describe("force remove trailing slash", () => {
    it("removes trailing slash on urls with no file extension", async () => {
      app.use(files({ trailingSlash: false }, { provider: provider }));

      await request(app).get("/foo/").expect(301).expect("Location", "/foo");
    });

    it("returns a 404 if a trailing slash was added to a valid path", async () => {
      app.use(files({ trailingSlash: false }, { provider: provider }));

      await request(app).get("/foo.html/").expect(404);
    });

    it("removes trailing slash on directory index urls", async () => {
      app.use(files({ trailingSlash: false }, { provider: provider }));

      await request(app).get("/foo/").expect(301).expect("Location", "/foo");
    });

    it("normalizes multiple leading slashes on a redirect", async () => {
      app.use(files({ trailingSlash: false }, { provider: provider }));

      await request(app).get("/foo////").expect(301).expect("Location", "/foo");
    });
  });

  [
    {
      trailingSlashBehavior: undefined,
      cleanUrls: false,
      tests: [
        { path: "/foo", wantRedirect: "/foo/" },
        { path: "/foo.html", wantContent: "foo.html content" },
        { path: "/foo.html/", wantNotFound: true },
        { path: "/foo/", wantContent: "foo/index.html content" },
        { path: "/foo/bar", wantNotFound: true },
        { path: "/foo/bar.html", wantContent: "foo/bar.html content" },
        { path: "/foo/bar.html/", wantNotFound: true },
        { path: "/foo/bar/", wantNotFound: true },
        { path: "/foo/index", wantNotFound: true },
        { path: "/foo/index.html", wantContent: "foo/index.html content" },
        { path: "/foo/index.html/", wantNotFound: true },
      ],
    },
    {
      trailingSlashBehavior: false,
      cleanUrls: false,
      tests: [
        { path: "/foo", wantContent: "foo/index.html content" },
        { path: "/foo.html", wantContent: "foo.html content" },
        { path: "/foo.html/", wantNotFound: true },
        { path: "/foo/", wantRedirect: "/foo" },
        { path: "/foo/bar", wantNotFound: true },
        { path: "/foo/bar.html", wantContent: "foo/bar.html content" },
        { path: "/foo/bar.html/", wantNotFound: true },
        { path: "/foo/bar/", wantNotFound: true },
        { path: "/foo/index", wantNotFound: true },
        { path: "/foo/index.html", wantContent: "foo/index.html content" },
        { path: "/foo/index.html/", wantNotFound: true },
      ],
    },
    {
      trailingSlashBehavior: true,
      cleanUrls: false,
      tests: [
        { path: "/foo", wantRedirect: "/foo/" },
        { path: "/foo.html", wantContent: "foo.html content" },
        { path: "/foo.html/", wantNotFound: true },
        { path: "/foo/", wantContent: "foo/index.html content" },
        { path: "/foo/bar", wantNotFound: true },
        { path: "/foo/bar.html", wantContent: "foo/bar.html content" },
        { path: "/foo/bar.html/", wantNotFound: true },
        { path: "/foo/bar/", wantNotFound: true },
        { path: "/foo/index", wantNotFound: true },
        { path: "/foo/index.html", wantContent: "foo/index.html content" },
        { path: "/foo/index.html/", wantNotFound: true },
      ],
    },
    {
      trailingSlashBehavior: undefined,
      cleanUrls: true,
      tests: [
        { path: "/foo", wantContent: "foo/index.html content" },
        { path: "/foo.html", wantRedirect: "/foo" },
        { path: "/foo.html/", wantNotFound: true },
        { path: "/foo/", wantContent: "foo/index.html content" },
        { path: "/foo/bar", wantContent: "foo/bar.html content" },
        { path: "/foo/bar.html", wantRedirect: "/foo/bar" },
        { path: "/foo/bar.html/", wantNotFound: true },
        { path: "/foo/bar/", wantNotFound: true },
        { path: "/foo/index", wantRedirect: "/foo" },
        { path: "/foo/index.html", wantRedirect: "/foo" },
        { path: "/foo/index.html/", wantNotFound: true },
      ],
    },
    {
      trailingSlashBehavior: false,
      cleanUrls: true,
      tests: [
        { path: "/foo", wantContent: "foo/index.html content" },
        { path: "/foo.html", wantRedirect: "/foo" },
        { path: "/foo.html/", wantNotFound: true },
        { path: "/foo/", wantRedirect: "/foo" },
        { path: "/foo/bar", wantContent: "foo/bar.html content" },
        { path: "/foo/bar.html", wantRedirect: "/foo/bar" },
        { path: "/foo/bar.html/", wantNotFound: true },
        { path: "/foo/bar/", wantRedirect: "/foo/bar" },
        { path: "/foo/index", wantRedirect: "/foo" },
        { path: "/foo/index.html", wantRedirect: "/foo" },
        { path: "/foo/index.html/", wantNotFound: true },
      ],
    },
    {
      trailingSlashBehavior: true,
      cleanUrls: true,
      tests: [
        { path: "/foo", wantRedirect: "/foo/" },
        { path: "/foo.html", wantRedirect: "/foo/" },
        { path: "/foo.html/", wantNotFound: true },
        { path: "/foo/", wantContent: "foo/index.html content" },
        { path: "/foo/bar", wantRedirect: "/foo/bar/" },
        { path: "/foo/bar.html", wantRedirect: "/foo/bar/" },
        { path: "/foo/bar.html/", wantNotFound: true },
        { path: "/foo/bar/", wantContent: "foo/bar.html content" },
        { path: "/foo/index", wantRedirect: "/foo/" },
        { path: "/foo/index.html", wantRedirect: "/foo/" },
        { path: "/foo/index.html/", wantNotFound: true },
      ],
    },
  ].forEach((t) => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const desc = `trailing slash ${t.trailingSlashBehavior} cleanUrls ${t.cleanUrls}`;
    t.tests.forEach((tt) => {
      const ttDesc = `${desc} ${JSON.stringify(tt)}`;
      it("should behave correctly: " + ttDesc, async () => {
        app.use(
          files(
            { trailingSlash: t.trailingSlashBehavior, cleanUrls: t.cleanUrls },
            { provider: provider },
          ),
        );

        const r = request(app).get(tt.path);
        if (tt.wantRedirect) {
          await r.expect(301).expect("Location", tt.wantRedirect);
        } else if (tt.wantNotFound) {
          await r.expect(404);
        } else if (tt.wantContent) {
          await r.expect(200).expect(tt.wantContent);
        } else {
          throw new Error("Test set up incorrectly");
        }
      });
    });
  });
});
