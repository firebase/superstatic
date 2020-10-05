/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const chai = require("chai");
chai.use(require("chai-as-promised"));
const expect = chai.expect;
const memoryProvider = require("../../../lib/providers/memory");
const RSVP = require("rsvp");

describe("memory provider", () => {
  let store;
  let provider;
  beforeEach(() => {
    store = store || {};
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

  it("should return an etag of the content", () => {
    store["/a.html"] = "foo";
    store["/b.html"] = "bar";
    return RSVP.hash({
      a: provider({}, "/a.html"),
      b: provider({}, "/b.html")
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
      6
    );
  });

  afterEach(() => {
    store = null;
  });
});
