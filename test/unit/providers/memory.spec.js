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
const memoryProvider = require("../../../src/providers/memory");

describe("memory provider", () => {
  let store;
  let provider;
  beforeEach(() => {
    store = store ?? {};
    provider = memoryProvider({ store: store });
  });

  it("should resolve null if not in the store", () => {
    return expect(provider({}, "/whatever")).to.eventually.be.null;
  });

  it("should return a stream of the content if found", (done) => {
    store["/index.html"] = "foobar";
    provider({}, "/index.html").then((result) => {
      let out = "";
      result.stream.on("data", (data) => {
        out += data;
      });
      result.stream.on("end", () => {
        expect(out).to.eq("foobar");
        done();
      });
    }, done);
  });

  it("should return an etag of the content", async () => {
    store["/a.html"] = "foo";
    store["/b.html"] = "bar";
    return Promise.resolve({
      a: await provider({}, "/a.html"),
      b: await provider({}, "/b.html"),
    }).then((result) => {
      expect(result.a.etag).not.to.be.null;
      expect(result.b.etag).not.to.be.null;
      expect(result.a.etag).not.to.eq(result.b.etag);
    });
  });

  it("should return the length of content", () => {
    store["/index.html"] = "foobar";
    return expect(provider({}, "/index.html")).to.eventually.have.property(
      "size",
      6,
    );
  });

  afterEach(() => {
    store = null;
  });
});
