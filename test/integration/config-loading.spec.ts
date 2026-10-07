/**
 * Copyright (c) 2026 Google LLC
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
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "chai";
import connect from "connect";
import request from "supertest";

import superstatic from "../../src/";

describe("explicit middleware configuration", () => {
  let originalCwd: string;
  let directory: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    directory = await fs.mkdtemp(join(tmpdir(), "superstatic-config-"));
    await fs.mkdir(join(directory, "public"));
    await fs.writeFile(
      join(directory, "public", "index.html"),
      "explicit config",
    );
    process.chdir(directory);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(directory, { recursive: true, force: true });
  });

  for (const filename of ["superstatic.json", "firebase.json"]) {
    it(`does not inherit headers or rewrites from ${filename} with autoConfig disabled`, async () => {
      const fileConfig = {
        headers: [
          { source: "**", headers: [{ key: "X-Autoloaded", value: "yes" }] },
        ],
        rewrites: [{ source: "**", destination: "/index.html" }],
      };
      await fs.writeFile(
        filename,
        JSON.stringify(
          filename === "firebase.json" ? { hosting: fileConfig } : fileConfig,
        ),
      );
      const options = {
        autoConfig: false,
        fallthrough: false,
        cwd: directory,
        config: {
          public: "public",
          redirects: [{ source: "/to-index", destination: "/index.html" }],
        },
      };
      const app = connect().use(superstatic(options));

      const response = await request(app)
        .get("/index.html")
        .expect(200)
        .expect("explicit config");
      expect(response.headers).not.to.have.property("x-autoloaded");
      await request(app)
        .get("/to-index")
        .expect(301)
        .expect("Location", "/index.html");
      await request(app).get("/missing").expect(404);
    });
  }
});
