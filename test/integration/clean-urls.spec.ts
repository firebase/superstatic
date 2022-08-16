/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

import * as fs from "node:fs/promises";
import * as connect from "connect";
import * as request from "supertest";

import * as superstatic from "../../src";

function options(): {
  config: { public: string; cleanUrls?: boolean | string[] };
} {
  return {
    config: {
      public: ".tmp",
    },
  };
}

describe("clean urls", () => {
  before(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
    await fs.mkdir(".tmp");
    await fs.mkdir(".tmp/dir");
    await fs.writeFile(".tmp/index.html", "index", "utf8");
    await fs.writeFile(".tmp/test.html", "test", "utf8");
    await fs.writeFile(".tmp/app.js", 'console.log("js")', "utf8");
    await fs.writeFile(".tmp/dir/index.html", "dir index", "utf8");
    await fs.writeFile(".tmp/dir/sub.html", "dir sub", "utf8");
  });

  after(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
  });

  it("not configured", async () => {
    const opts = options();

    const app = connect().use(superstatic(opts));

    await request(app).get("/test").expect(404);
  });

  it("redirects html file", async () => {
    const opts = options();

    opts.config.cleanUrls = true;

    const app = connect().use(superstatic(opts));

    await request(app)
      .get("/test.html")
      .expect(301)
      .expect("Location", "/test");
  });

  it("serves html file", async () => {
    const opts = options();

    opts.config.cleanUrls = true;

    const app = connect().use(superstatic(opts));

    await request(app).get("/test").expect(200).expect("test");
  });

  it("redirects using globs", async () => {
    const opts = options();

    opts.config.cleanUrls = ["/*.html"];

    const app = connect().use(superstatic(opts));

    await request(app)
      .get("/test.html")
      .expect(301)
      .expect("Location", "/test");
  });

  it("serves html file using globs", async () => {
    const opts = options();

    opts.config.cleanUrls = ["*.html"];

    const app = connect().use(superstatic(opts));

    await request(app).get("/test").expect(200).expect("test");
  });
});
