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

const chai = require("chai");
chai.use(require("chai-as-promised"));
const expect = chai.expect;
const path = require("path");

const fsp = require("../../../src/providers/fs");

const concatStream = require("concat-stream");
const readStatStream = function (stat) {
  const stream = stat.stream;
  return new Promise((resolve, reject) => {
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
      public: "a",
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
