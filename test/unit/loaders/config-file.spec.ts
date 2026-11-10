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
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import * as path from "node:path";
import { expect } from "chai";

import loadConfigFile from "../../../src/loaders/config-file";

const ROOT_DIR = process.cwd();
const TMP_DIR = path.join(ROOT_DIR, ".tmp");

describe("loading config files", () => {
  beforeEach(async () => {
    await fs.rm(TMP_DIR, { recursive: true, force: true });
    await fs.mkdir(TMP_DIR, { recursive: true });
    await fs.writeFile(
      path.join(TMP_DIR, "file.json"),
      '{"public": "app"}',
      "utf-8",
    );
  });

  afterEach(async () => {
    process.chdir(ROOT_DIR);
    await fs.rm(TMP_DIR, { recursive: true, force: true });
  });

  it("filename", () => {
    const data = loadConfigFile(".tmp/file.json");

    expect(data).to.eql({
      public: "app",
    });
  });

  it("loads first existing file in array", () => {
    const data = loadConfigFile(["another.json", ".tmp/file.json"]);

    expect(data).to.eql({
      public: "app",
    });
  });

  it("loads first existing file when array contains absolute paths", () => {
    const data = loadConfigFile([
      path.join(TMP_DIR, "nonexistent.json"),
      path.join(TMP_DIR, "file.json"),
    ]);

    expect(data).to.eql({
      public: "app",
    });
  });

  it("empty object for when no file", () => {
    const data = loadConfigFile(".tmp/nope.json");

    expect(data).to.eql({});
  });

  it("loads object as config", () => {
    const config = loadConfigFile({
      public: "dist",
      cleanUrls: true,
    });

    expect(config).to.eql({
      public: "dist",
      cleanUrls: true,
    });
  });

  it("returns a config loader function unchanged", () => {
    const loader = (req: IncomingMessage, res: ServerResponse) => ({
      public: req.url ?? (res.statusCode ? "app" : "public"),
    });
    const configInput: string | typeof loader = loader;
    const resolved = loadConfigFile(configInput);

    expect(resolved).to.equal(loader);
    if (typeof resolved === "function") {
      const req = new IncomingMessage(new Socket());
      req.url = "/site";
      const res = new ServerResponse(req);
      expect(resolved(req, res)).to.eql({ public: "/site" });
    }
  });

  it("returns an async config loader function unchanged", () => {
    const loader = () => Promise.resolve({ public: "app" });

    expect(loadConfigFile(loader)).to.equal(loader);
  });

  it("parses a JSON string as config", () => {
    const config = loadConfigFile('{"public": "app"}');

    expect(config).to.eql({
      public: "app",
    });
  });

  it("extracts the hosting property when present in JSON file", async () => {
    await fs.writeFile(
      path.join(TMP_DIR, "firebase-hosting.json"),
      JSON.stringify({
        hosting: {
          public: "dist",
        },
        firestore: {
          rules: "firestore.rules",
        },
      }),
      "utf-8",
    );

    const config = loadConfigFile(".tmp/firebase-hosting.json");

    expect(config).to.eql({
      public: "dist",
    });
  });

  it("returns an empty object when hosting is a multi-site array in JSON file", async () => {
    await fs.writeFile(
      path.join(TMP_DIR, "firebase-multisite.json"),
      JSON.stringify({
        hosting: [{ target: "site-a", public: "public" }],
        firestore: { rules: "firestore.rules" },
        functions: { source: "functions" },
      }),
      "utf-8",
    );

    const config = loadConfigFile(".tmp/firebase-multisite.json");

    expect(config).to.eql({});
  });

  it("returns an empty object when a JSON file is malformed", async () => {
    await fs.writeFile(
      path.join(TMP_DIR, "invalid.json"),
      "{not valid json",
      "utf-8",
    );

    const config = loadConfigFile(".tmp/invalid.json");

    expect(config).to.eql({});
  });

  describe("automatic config discovery", () => {
    beforeEach(() => {
      process.chdir(TMP_DIR);
    });

    for (const filename of ["superstatic.json", "firebase.json"]) {
      it(`does not merge ${filename} into an explicit object`, async () => {
        const fileConfig = { public: "default", headers: [{ source: "**" }] };
        await fs.writeFile(
          filename,
          JSON.stringify(
            filename === "firebase.json" ? { hosting: fileConfig } : fileConfig,
          ),
        );

        expect(loadConfigFile({ public: "app" }, false)).to.eql({
          public: "app",
        });
        expect(loadConfigFile(JSON.stringify({ public: "app" }), false)).to.eql(
          {
            public: "app",
          },
        );
        expect(loadConfigFile({}, false)).to.eql({});
        expect(loadConfigFile(undefined, false)).to.eql({});
      });

      for (const autoConfig of [undefined, true]) {
        it(`still merges ${filename} when autoConfig is ${autoConfig}`, async () => {
          const fileConfig = { public: "default", cleanUrls: true };
          await fs.writeFile(
            filename,
            JSON.stringify(
              filename === "firebase.json"
                ? { hosting: fileConfig }
                : fileConfig,
            ),
          );

          expect(loadConfigFile({ public: "app" }, autoConfig)).to.eql({
            public: "app",
            cleanUrls: true,
          });
        });

        it(`merges a stringified object with ${filename} when autoConfig is ${autoConfig}`, async () => {
          const fileConfig = { public: "default", cleanUrls: true };
          await fs.writeFile(
            filename,
            JSON.stringify(
              filename === "firebase.json"
                ? { hosting: fileConfig }
                : fileConfig,
            ),
          );

          expect(
            loadConfigFile(JSON.stringify({ public: "app" }), autoConfig),
          ).to.eql({
            public: "app",
            cleanUrls: true,
          });
        });
      }
    }

    it("still loads an explicit config filename", async () => {
      await fs.writeFile(
        "custom.json",
        JSON.stringify({ hosting: { public: "app" } }),
      );
      expect(loadConfigFile("custom.json", false)).to.eql({ public: "app" });
    });

    it("still loads a stringified config object", () => {
      expect(loadConfigFile(JSON.stringify({ public: "app" }), false)).to.eql({
        public: "app",
      });
    });
  });

  describe("extends the file config with the object passed", () => {
    beforeEach(() => {
      process.chdir(TMP_DIR);
    });

    it("superstatic.json", async () => {
      await fs.writeFile(
        "superstatic.json",
        '{"cleanUrls": true, "public": "./"}',
        "utf-8",
      );

      const config = loadConfigFile({
        trailingSlash: false,
        public: "app",
      });

      expect(config).to.eql({
        cleanUrls: true,
        trailingSlash: false,
        public: "app",
      });
    });

    it("firebase.json", async () => {
      await fs.writeFile(
        "firebase.json",
        '{"cleanUrls": true, "public": "./"}',
        "utf-8",
      );

      const config = loadConfigFile({
        trailingSlash: false,
        public: "app",
      });

      expect(config).to.eql({
        cleanUrls: true,
        trailingSlash: false,
        public: "app",
      });
    });

    it("merges a JSON string config over the default config file", async () => {
      await fs.writeFile(
        "superstatic.json",
        '{"cleanUrls": true, "public": "./"}',
        "utf-8",
      );

      const config = loadConfigFile(
        '{"trailingSlash": false, "public": "app"}',
      );

      expect(config).to.eql({
        cleanUrls: true,
        trailingSlash: false,
        public: "app",
      });
    });

    it("loads default config file when an empty JSON object string is passed", async () => {
      await fs.writeFile(
        "superstatic.json",
        '{"cleanUrls": true, "public": "./"}',
        "utf-8",
      );

      const config = loadConfigFile("{}");

      expect(config).to.eql({
        cleanUrls: true,
        public: "./",
      });
    });
  });
});
