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

import { use, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import concatStream from "concat-stream";
import * as path from "node:path";
import * as fs from "node:fs";
import * as fsPromises from "node:fs/promises";
use(chaiAsPromised);

import fsp from "../../../src/providers/fs";

async function readStatStream(
  stat: {
    stream: fs.ReadStream;
  } | null,
): Promise<string> {
  if (!stat) {
    throw new Error("do not have stat");
  }
  const stream = stat?.stream;
  return new Promise((resolve, reject) => {
    stream.on("error", reject);
    stream.pipe(
      concatStream({ encoding: "string" }, (body: string) => {
        resolve(body);
      }),
    );
  });
}

describe("provider: fs", () => {
  let opts: { cwd?: string; public?: string[] | string } = {};

  beforeEach(() => {
    opts = {
      cwd: path.resolve(path.join(__dirname, "..", "..", "fixtures")),
      public: "a",
    };
  });

  it("should return stat information for a file that exists", async () => {
    await fsp(opts)({}, "/index.html")
      .then(readStatStream)
      .then((body: string) => {
        expect(body.trim()).to.eq("A");
      });
  });

  it("should reuse cached etag when mtime is unchanged and recompute when mtime changes", async () => {
    const tmpDir = await fsPromises.mkdtemp(path.join(".tmp-fs-cache-"));
    try {
      const filePath = path.join(tmpDir, "cached.txt");
      await fsPromises.writeFile(filePath, "initial", "utf8");
      const fixedTime = new Date(1700000000000);
      await fsPromises.utimes(filePath, fixedTime, fixedTime);

      const provider = fsp({ cwd: tmpDir, public: "." });
      const first = await provider({}, "/cached.txt");
      first?.stream.destroy();

      // Change content while keeping mtime identical: cache should return first.etag.
      await fsPromises.writeFile(filePath, "updated", "utf8");
      await fsPromises.utimes(filePath, fixedTime, fixedTime);
      const second = await provider({}, "/cached.txt");
      second?.stream.destroy();

      expect(first?.etag).to.be.a("string");
      expect(second?.etag).to.equal(first?.etag);

      // Bump mtime: cache should miss and recompute etag for updated content.
      const bumpedTime = new Date(1700000001000);
      await fsPromises.utimes(filePath, bumpedTime, bumpedTime);
      const third = await provider({}, "/cached.txt");
      third?.stream.destroy();

      expect(third?.etag).to.be.a("string");
      expect(third?.etag).to.not.equal(first?.etag);
    } finally {
      await fsPromises.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("should reject with an Error when public is empty", async () => {
    await expect(
      fsp({ ...opts, public: [] })({}, "/index.html"),
    ).to.eventually.be.rejectedWith("No paths provided to multiStat");
  });

  it("should return null if ../", async () => {
    await expect(fsp(opts)({}, "/../b/b.html")).to.eventually.be.null;
  });

  it("should return null if ..\\", async () => {
    await expect(fsp(opts)({}, "/..\\b\\b.html")).to.eventually.be.null;
  });

  it("should return null if ..%5c", async () => {
    await expect(fsp(opts)({}, "/..%5Cb%5cb.html")).to.eventually.be.null;
  });

  it("should return null if path has null bytes", async () => {
    await expect(fsp(opts)({}, "/\0a.html")).to.eventually.be.null;
  });

  it("should return null for a file that does not exist", async () => {
    await expect(fsp(opts)({}, "/bogus.html")).to.eventually.be.null;
  });

  describe("multiple publics", () => {
    beforeEach(() => {
      opts.public = ["a", "b"];
    });

    it("should return the first file found for multiple publics", async () => {
      await fsp(opts)({}, "/index.html")
        .then(readStatStream)
        .then((body: string) => {
          expect(body.trim()).to.eq("A");
        });

      await fsp(opts)({}, "/b.html")
        .then(readStatStream)
        .then((body: string) => {
          expect(body.trim()).to.eq("B");
        });
    });

    it("should return null if neither public has the file", async () => {
      await expect(fsp(opts)({}, "/bogus.html")).to.eventually.be.null;
    });
  });
});
