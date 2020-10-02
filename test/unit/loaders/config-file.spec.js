/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const fs = require("fs-extra");
const expect = require("chai").expect;

const loadConfigFile = require("../../../lib/loaders/config-file");

describe("loading config files", () => {
  beforeEach(() => {
    fs.outputFileSync(".tmp/file.json", '{"key": "value"}', "utf-8");
    fs.outputFileSync(
      ".tmp/package.json",
      JSON.stringify({
        superstatic: {
          key: "value"
        }
      })
    );
  });

  afterEach(() => {
    fs.removeSync(".tmp");
  });

  it("filename", (done) => {
    const data = loadConfigFile(".tmp/file.json");

    expect(data).to.eql({
      key: "value"
    });
    done();
  });

  it("loads first existing file in array", (done) => {
    const data = loadConfigFile(["another.json", ".tmp/file.json"]);

    expect(data).to.eql({
      key: "value"
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
      my: "data"
    });

    expect(config).to.eql({
      my: "data"
    });
    done();
  });

  describe("extends the file config with the object passed", () => {
    it("superstatic.json", (done) => {
      fs.outputFileSync(
        "superstatic.json",
        '{"firebase": "superstatic", "public": "./"}',
        "utf-8"
      );

      const config = loadConfigFile({
        override: "test",
        public: "app"
      });

      expect(config).to.eql({
        firebase: "superstatic",
        override: "test",
        public: "app"
      });

      fs.removeSync("superstatic.json");
      done();
    });

    it("firebase.json", (done) => {
      fs.outputFileSync(
        "firebase.json",
        '{"firebase": "example", "public": "./"}',
        "utf-8"
      );

      const config = loadConfigFile({
        override: "test",
        public: "app"
      });

      expect(config).to.eql({
        firebase: "example",
        override: "test",
        public: "app"
      });

      fs.removeSync("firebase.json");
      done();
    });
  });
});
