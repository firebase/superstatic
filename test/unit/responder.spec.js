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

const Responder = require("../../src/responder");
const _ = require("lodash");
const chai = require("chai");
const sinon = require("sinon");
chai.use(require("chai-as-promised"));
chai.use(require("sinon-chai"));
const expect = chai.expect;

describe("Responder", () => {
  let responder;

  describe("#handle", () => {
    beforeEach(() => {
      responder = new Responder({}, { setHeader: _.noop, end: _.noop }, {});
    });

    it("should resolve as false with an empty stack", () => {
      return expect(responder.handle([])).to.eventually.eq(false);
    });

    it("should call the stack if an array is passed", () => {
      return expect(responder.handle([{ data: "abcdef" }])).to.eventually.eq(
        true,
      );
    });

    it("should call through to handleFile with a string", () => {
      const stub = sinon
        .stub(responder, "handleFile")
        .returns(Promise.resolve(true));
      responder.handle("abc/def.html");
      expect(stub).to.have.been.calledWith({ file: "abc/def.html" });
    });

    it("should call through to handleFile with a file object", () => {
      const stub = sinon
        .stub(responder, "handleFile")
        .returns(Promise.resolve(true));
      responder.handle({ file: "abc/def.html" });
      expect(stub).to.have.been.calledWith({ file: "abc/def.html" });
    });

    it("should call through to handleData with a data object", () => {
      const stub = sinon
        .stub(responder, "handleData")
        .returns(Promise.resolve(true));
      const obj = { data: "abc def" };
      responder.handle(obj);
      expect(stub).to.have.been.calledWith(obj);
    });

    it("should call through to handleRedirect with a redirect object", () => {
      const stub = sinon
        .stub(responder, "handleRedirect")
        .returns(Promise.resolve(true));
      const obj = { redirect: "/" };
      responder.handle(obj);
      expect(stub).to.have.been.calledWith(obj);
    });

    it("should call through to handleRewrite with a rewrite object", () => {
      const stub = sinon
        .stub(responder, "handleRewrite")
        .returns(Promise.resolve(true));
      const obj = { rewrite: {} };
      responder.handle(obj);
      expect(stub).to.have.been.calledWith(obj);
    });
  });

  describe("#_handle", () => {
    beforeEach(() => {
      responder = new Responder({}, { setHeader: _.noop, end: _.noop }, {});
    });

    it("should reject with an unrecognized payload", () => {
      return expect(responder._handle({ foo: "bar" })).to.be.rejectedWith(
        "is not a recognized responder directive",
      );
    });
  });

  describe("#handleRewrite", () => {
    it("should call through to a registered custom rewriter", () => {
      let out;
      responder = new Responder(
        {},
        {
          setHeader: _.noop,
          end: function (data) {
            out = data;
          },
        },
        {
          rewriters: {
            message: function (rewrite) {
              return Promise.resolve({
                data: rewrite.message,
                contentType: "text/plain",
                status: 200,
              });
            },
          },
        },
      );

      return responder
        .handleRewrite({ rewrite: { message: "hi" } })
        .then((result) => {
          expect(result).to.equal(true);
          expect(out).to.equal("hi");
        });
    });
  });

  describe("#handleMiddleware", () => {
    let rq;
    beforeEach(() => {
      rq = {};
      responder = new Responder(rq, { setHeader: _.noop, end: _.noop }, {});
    });

    it("should call the middleware", (done) => {
      responder.handleMiddleware(() => {
        done();
      });
    });

    it("should resolve false if next is called", () => {
      return responder
        .handleMiddleware((req, res, next) => {
          next();
        })
        .then((result) => {
          expect(result).to.equal(false);
        });
    });
  });

  describe("#handleFile", () => {
    const req = {};
    const res = {};
    let stub;

    beforeEach(() => {
      stub = sinon.stub();
      responder = new Responder(req, res, {
        provider: stub,
      });
    });

    it("should call through to provider", async () => {
      stub.returns(Promise.resolve());
      await responder.handleFile({ file: "abc/def.html" });
      expect(stub).to.have.been.calledWithExactly(req, "abc/def.html");
    });
  });

  describe("#isNotModified", () => {
    let result;

    beforeEach(() => {
      responder = new Responder({ headers: {} }, {}, {});
      result = {
        modified: Date.now(),
        etag: "abcdef",
      };
    });

    it("should be false if there are no if-modified-since or if-none-match headers", () => {
      expect(responder.isNotModified(result)).to.equal(false);
    });

    it("should be false if there is a non-matching etag", () => {
      responder.req.headers["if-none-match"] = "defabc";
      expect(responder.isNotModified(result)).to.equal(false);
    });

    it("should be true if there is a matching etag", () => {
      responder.req.headers["if-none-match"] = "abcdef";
      expect(responder.isNotModified(result)).to.equal(true);
    });

    it("should be true if there is an if-modified-since after the modified", () => {
      responder.req.headers["if-modified-since"] = new Date(
        result.modified + 30000,
      ).toUTCString();
      expect(responder.isNotModified(result)).to.equal(true);
    });

    it("should be false if there is an if-modified-since before the modified", () => {
      responder.req.headers["if-modified-since"] = new Date(
        result.modified - 30000,
      ).toUTCString();
      expect(responder.isNotModified(result)).to.equal(false);
    });
  });

  describe("#handleNotModified", () => {
    it("should return true, indicating it responded", () => {
      responder = new Responder({}, { removeHeader: _.noop, end: _.noop }, {});

      const r = responder.handleNotModified();
      expect(r).to.equal(true);
    });
  });
});
