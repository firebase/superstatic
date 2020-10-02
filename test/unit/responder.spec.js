/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const Responder = require("../../lib/responder");
const RSVP = require("rsvp");
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
        true
      );
    });

    it("should call through to handleFile with a string", () => {
      const stub = sinon
        .stub(responder, "handleFile")
        .returns(RSVP.resolve(true));
      responder.handle("abc/def.html");
      expect(stub).to.have.been.calledWith({ file: "abc/def.html" });
    });

    it("should call through to handleFile with a file object", () => {
      const stub = sinon
        .stub(responder, "handleFile")
        .returns(RSVP.resolve(true));
      responder.handle({ file: "abc/def.html" });
      expect(stub).to.have.been.calledWith({ file: "abc/def.html" });
    });

    it("should call through to handleData with a data object", () => {
      const stub = sinon
        .stub(responder, "handleData")
        .returns(RSVP.resolve(true));
      const obj = { data: "abc def" };
      responder.handle(obj);
      expect(stub).to.have.been.calledWith(obj);
    });

    it("should call through to handleRedirect with a redirect object", () => {
      const stub = sinon
        .stub(responder, "handleRedirect")
        .returns(RSVP.resolve(true));
      const obj = { redirect: "/" };
      responder.handle(obj);
      expect(stub).to.have.been.calledWith(obj);
    });

    it("should call through to handleRewrite with a rewrite object", () => {
      const stub = sinon
        .stub(responder, "handleRewrite")
        .returns(RSVP.resolve(true));
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
        "is not a recognized responder directive"
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
          end: function(data) {
            out = data;
          }
        },
        {
          rewriters: {
            message: function(rewrite) {
              return RSVP.resolve({
                data: rewrite.message,
                contentType: "text/plain",
                status: 200
              });
            }
          }
        }
      );

      return responder
        .handleRewrite({ rewrite: { message: "hi" } })
        .then((result) => {
          expect(result).to.be.true;
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
          expect(result).to.be.false;
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
        provider: stub
      });
    });

    it("should call through to provider", () => {
      stub.returns(RSVP.resolve({}));
      responder.handleFile({ file: "abc/def.html" });
      expect(stub).to.have.been.calledWith(req, "abc/def.html");
    });
  });

  describe("#isNotModified", () => {
    let result;

    beforeEach(() => {
      responder = new Responder({ headers: {} }, {}, {});
      result = {
        modified: Date.now(),
        etag: "abcdef"
      };
    });

    it("should be false if there are no if-modified-since or if-none-match headers", () => {
      expect(responder.isNotModified(result)).to.be.false;
    });

    it("should be false if there is a non-matching etag", () => {
      responder.req.headers["if-none-match"] = "defabc";
      expect(responder.isNotModified(result)).to.be.false;
    });

    it("should be true if there is a matching etag", () => {
      responder.req.headers["if-none-match"] = "abcdef";
      expect(responder.isNotModified(result)).to.be.true;
    });

    it("should be true if there is an if-modified-since after the modified", () => {
      responder.req.headers["if-modified-since"] = new Date(
        result.modified + 30000
      ).toUTCString();
      expect(responder.isNotModified(result)).to.be.true;
    });

    it("should be false if there is an if-modified-since before the modified", () => {
      responder.req.headers["if-modified-since"] = new Date(
        result.modified - 30000
      ).toUTCString();
      expect(responder.isNotModified(result)).to.be.false;
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
