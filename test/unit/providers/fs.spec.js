/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const chai = require("chai");
chai.use(require("chai-as-promised"));
const expect = chai.expect;
const path = require("path");
const RSVP = require("rsvp");

const fsp = require("../../../lib/providers/fs");

const concatStream = require("concat-stream");
const readStatStream = function(stat) {
  const stream = stat.stream;
  return new RSVP.Promise((resolve, reject) => {
    stream.on("error", (err) => {
      return reject(err);
    });

    stream.pipe(
      concatStream({ encoding: "string" }, (str) => {
        return resolve(str);
      })
    );
  });
};

describe("provider: fs", () => {
  let opts = {};

  beforeEach(() => {
    opts = {
      cwd: path.resolve(path.join(__dirname, "..", "..", "fixtures")),
      public: "a"
    };
  });

  it("should return stat information for a file that exists", () => {
    return fsp(opts)({}, "/index.html")
      .then(readStatStream)
      .then((body) => {
        expect(body).to.eq("A\n");
      });
  });

  it("should return null if ../", () => {
    return expect(fsp(opts)({}, "/../b/b.html")).to.eventually.be.null;
  });

  it("should return null if ..\\", () => {
    return expect(fsp(opts)({}, "/..\\b\\b.html")).to.eventually.be.null;
  });

  it("should return null if ..%5c", () => {
    return expect(fsp(opts)({}, "/..%5Cb%5cb.html")).to.eventually.be.null;
  });

  it("should return null for a file that does not exist", () => {
    return expect(fsp(opts)({}, "/bogus.html")).to.eventually.be.null;
  });

  describe("multiple publics", () => {
    beforeEach(() => {
      opts.public = ["a", "b"];
    });

    it("should return the first file found for multiple publics", () => {
      return fsp(opts)({}, "/index.html")
        .then(readStatStream)
        .then((body) => {
          expect(body).to.eq("A\n");
          return fsp(opts)({}, "/b.html").then(readStatStream);
        })
        .then((body) => {
          expect(body).to.eq("B\n");
        });
    });

    it("should return null if neither public has the file", () => {
      return expect(fsp(opts)({}, "/bogus.html")).to.eventually.be.null;
    });
  });
});
