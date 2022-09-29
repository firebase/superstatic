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

const fs = require("node:fs/promises");
const expect = require("chai").expect;

const loadConfigFile = require("../../../src/loaders/config-file");

describe("loading config files", () => {
  beforeEach(async () => {
    await fs.mkdir(".tmp");
    await fs.writeFile(".tmp/file.json", '{"key": "value"}', "utf-8");
    await fs.writeFile(
      ".tmp/package.json",
      JSON.stringify({
        superstatic: {
          key: "value",
        },
      })
    );
  });

  afterEach(async () => {
    await fs.rm(".tmp", { recursive: true, force: true });
  });

  it("filename", (done) => {
    const data = loadConfigFile(".tmp/file.json");

    expect(data).to.eql({
      key: "value",
    });
    done();
  });

  it("loads first existing file in array", (done) => {
    const data = loadConfigFile(["another.json", ".tmp/file.json"]);

    expect(data).to.eql({
      key: "value",
    });
    done();
  });

  it("empty object for when no file", (done) => {
    const data = loadConfigFile(".tmp/nope.json");
    expect(data).to.eql({});
    done();
  });

  it("loads object as config", (done) => {
    const config = loadConfigFile({
      my: "data",
    });

    expect(config).to.eql({
      my: "data",
    });
    done();
  });

  describe("extends the file config with the object passed", () => {
    it("superstatic.json", async () => {
      await fs.writeFile(
        "superstatic.json",
        '{"firebase": "superstatic", "public": "./"}',
        "utf-8"
      );

      const config = loadConfigFile({
        override: "test",
        public: "app",
      });

      expect(config).to.eql({
        firebase: "superstatic",
        override: "test",
        public: "app",
      });

      await fs.rm("superstatic.json");
    });

    it("firebase.json", async () => {
      await fs.writeFile(
        "firebase.json",
        '{"firebase": "example", "public": "./"}',
        "utf-8"
      );

      const config = loadConfigFile({
        override: "test",
        public: "app",
      });

      expect(config).to.eql({
        firebase: "example",
        override: "test",
        public: "app",
      });

      await fs.rm("firebase.json");
    });
  });
});
