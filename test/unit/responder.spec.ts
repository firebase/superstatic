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

import * as http from "node:http";
import * as net from "node:net";
import { Readable } from "node:stream";
import { use, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import connect from "connect";
import * as sinon from "sinon";
import sinonChai from "sinon-chai";
import request from "supertest";

import Responder from "../../src/responder";

use(chaiAsPromised);
use(sinonChai);

function createMockRequest(
  headers: http.IncomingHttpHeaders = {},
): http.IncomingMessage {
  const req = new http.IncomingMessage(new net.Socket());
  req.headers = headers;
  return req;
}

function createMockResponse(
  req: http.IncomingMessage = createMockRequest(),
): http.ServerResponse {
  return new http.ServerResponse(req);
}

describe("Responder", () => {
  let responder: Responder;

  afterEach(() => {
    sinon.restore();
  });

  describe("#handle", () => {
    beforeEach(() => {
      responder = new Responder(createMockRequest(), createMockResponse());
    });

    it("should resolve as false with an empty stack", () => {
      return expect(responder.handle([])).to.eventually.eq(false);
    });

    it("should call the stack if an array is passed", () => {
      return expect(responder.handle([{ data: "abcdef" }])).to.eventually.eq(
        true,
      );
    });

    it("should call through to handleFile with a string", async () => {
      const stub = sinon
        .stub(responder, "handleFile")
        .returns(Promise.resolve(true));
      await responder.handle("abc/def.html");
      expect(stub).to.have.been.calledWith({ file: "abc/def.html" });
    });

    it("should call through to handleFile with a file object", async () => {
      const stub = sinon
        .stub(responder, "handleFile")
        .returns(Promise.resolve(true));
      await responder.handle({ file: "abc/def.html" });
      expect(stub).to.have.been.calledWith({ file: "abc/def.html" });
    });

    it("should call through to handleData with a data object", async () => {
      const stub = sinon
        .stub(responder, "handleData")
        .returns(Promise.resolve(true));
      const obj = { data: "abc def" };
      await responder.handle(obj);
      expect(stub).to.have.been.calledWith(obj);
    });

    it("should call through to handleRedirect with a redirect object", async () => {
      const stub = sinon
        .stub(responder, "handleRedirect")
        .returns(Promise.resolve(true));
      const obj = { redirect: "/" };
      await responder.handle(obj);
      expect(stub).to.have.been.calledWith(obj);
    });

    it("should call through to handleRewrite with a rewrite object", async () => {
      const stub = sinon
        .stub(responder, "handleRewrite")
        .returns(Promise.resolve(true));
      const obj = { rewrite: {} };
      await responder.handle(obj);
      expect(stub).to.have.been.calledWith(obj);
    });

    it("should call next when directive resolves to false", async () => {
      const next = sinon.spy();
      const responded = await responder.handle([], next);
      expect(responded).to.equal(false);
      expect(next).to.have.callCount(1);
    });

    it("should delegate errors to handleError", async () => {
      const stub = sinon.stub(responder, "handleError");
      await responder.handle({ unknown: true });
      expect(stub).to.have.callCount(1);
    });
  });

  describe("#_handle", () => {
    beforeEach(() => {
      responder = new Responder(createMockRequest(), createMockResponse());
    });

    it("should reject with an unrecognized payload", () => {
      return expect(responder._handle({ foo: "bar" })).to.be.rejectedWith(
        "is not a recognized responder directive",
      );
    });
  });

  describe("#handleRewrite", () => {
    it("should call handleFile when destination is configured", async () => {
      responder = new Responder(createMockRequest(), createMockResponse());
      const stub = sinon
        .stub(responder, "handleFile")
        .returns(Promise.resolve(true));

      const result = await responder.handleRewrite({
        rewrite: { destination: "/index.html" },
      });
      expect(result).to.equal(true);
      expect(stub).to.have.been.calledWithExactly({ file: "/index.html" });
    });

    it("should call through to a registered custom rewriter", async () => {
      let out: unknown;
      const req = createMockRequest();
      const res = createMockResponse(req);
      sinon.stub(res, "end").callsFake((chunk?: unknown) => {
        out = chunk;
        return res;
      });
      responder = new Responder(req, res, {
        rewriters: {
          message: function (rewrite) {
            return Promise.resolve({
              data: typeof rewrite.message === "string" ? rewrite.message : "",
              contentType: "text/plain",
              status: 200,
            });
          },
        },
      });

      const result = await responder.handleRewrite({
        rewrite: { message: "hi" },
      });
      expect(result).to.equal(true);
      expect(out).to.equal("hi");
    });

    it("should reject when no matching rewriter is configured", () => {
      responder = new Responder(createMockRequest(), createMockResponse());
      return expect(
        responder.handleRewrite({ rewrite: { unknown: "value" } }),
      ).to.be.rejectedWith("Unable to find a matching rewriter");
    });
  });

  describe("#handleMiddleware", () => {
    let rq: http.IncomingMessage;
    beforeEach(() => {
      rq = createMockRequest();
      responder = new Responder(rq, createMockResponse(rq));
    });

    it("should call the middleware", (done) => {
      void responder.handleMiddleware(() => {
        done();
      });
    });

    it("should resolve false if next is called", async () => {
      const result = await responder.handleMiddleware((req, res, next) => {
        expect(req).to.equal(rq);
        expect(res).to.equal(responder.res);
        next();
      });
      expect(result).to.equal(false);
    });
  });

  describe("#handleFile", () => {
    let req: http.IncomingMessage;
    let res: http.ServerResponse;
    let stub: sinon.SinonStub;

    beforeEach(() => {
      req = createMockRequest();
      res = createMockResponse(req);
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

    it("should return false when provider returns null", async () => {
      stub.returns(Promise.resolve(null));
      const result = await responder.handleFile({ file: "missing.html" });
      expect(result).to.equal(false);
    });

    it("should call handleNotModified when resource is not modified", async () => {
      req.headers["if-none-match"] = "etag-1";
      stub.returns(
        Promise.resolve({
          etag: "etag-1",
          stream: Readable.from(["hello"]),
        }),
      );
      const notModifiedSpy = sinon.spy(responder, "handleNotModified");
      const result = await responder.handleFile({ file: "abc/def.html" });
      expect(result).to.equal(true);
      expect(notModifiedSpy).to.have.callCount(1);
      expect(res.statusCode).to.equal(304);
    });
  });

  describe("#handleFileStream", () => {
    it("should stream file content, record streamedFile, and set headers", async () => {
      const modified = Date.UTC(2026, 0, 1);
      let handleResult: boolean | undefined;
      const app = connect().use((req, res) => {
        responder = new Responder(req, res, {
          config: { errorPage: "/404.html" },
        });
        void responder
          .handleFileStream(
            { file: "/404.html" },
            {
              size: 5,
              etag: "abc123",
              modified,
              stream: Readable.from(["hello"]),
            },
          )
          .then((result) => {
            handleResult = result;
          });
      });

      const response = await request(app)
        .get("/404.html")
        .expect(404)
        .expect("hello")
        .expect("content-type", "text/html; charset=utf-8")
        .expect("content-length", "5")
        .expect("etag", "abc123")
        .expect("last-modified", new Date(modified).toUTCString());

      expect(response.status).to.equal(404);
      expect(handleResult).to.equal(true);
      expect(responder.streamedFile).to.deep.equal({ file: "/404.html" });
    });

    it("should invoke compressor when configured", async () => {
      const compressor = sinon.spy(
        (
          _req: http.IncomingMessage,
          _res: http.ServerResponse,
          next: () => void,
        ) => {
          next();
        },
      );
      let handleResult: boolean | undefined;
      const app = connect().use((req, res) => {
        responder = new Responder(req, res, { compressor });
        void responder
          .handleFileStream(
            { file: "/app.js", status: 201 },
            {
              stream: Readable.from(["console.log(1)"]),
            },
          )
          .then((result) => {
            handleResult = result;
          });
      });

      await request(app)
        .get("/app.js")
        .expect(201)
        .expect("console.log(1)")
        .expect("content-type", "application/javascript; charset=utf-8");

      expect(handleResult).to.equal(true);
      expect(compressor).to.have.callCount(1);
    });

    it("should handle stream errors via handleError and destroy the stream", async () => {
      const logStub = sinon.stub(console, "log");
      const failingStream = new Readable({
        read() {
          process.nextTick(() => {
            this.emit("error", new Error("disk read failure"));
          });
        },
      });
      let handleErrorSpy: sinon.SinonSpy | undefined;
      let handleResult: boolean | undefined;
      const app = connect().use((req, res) => {
        responder = new Responder(req, res);
        handleErrorSpy = sinon.spy(responder, "handleError");
        void responder
          .handleFileStream(
            { file: "/broken.txt" },
            {
              stream: failingStream,
            },
          )
          .then((result) => {
            handleResult = result;
          });
      });

      await request(app)
        .get("/broken.txt")
        .expect(500, "Unexpected error occurred.");

      expect(handleResult).to.equal(true);
      expect(failingStream.destroyed).to.equal(true);
      expect(handleErrorSpy).to.have.callCount(1);
      expect(logStub).to.have.callCount(1);
    });
  });

  describe("#handleRedirect", () => {
    it("should set redirect status and Location header", async () => {
      const req = createMockRequest();
      const res = createMockResponse(req);
      responder = new Responder(req, res);

      const result = await responder.handleRedirect({ redirect: "/target" });
      expect(result).to.equal(true);
      expect(res.statusCode).to.equal(301);
      expect(res.getHeader("Location")).to.equal("/target");
      expect(res.getHeader("Content-Type")).to.equal(
        "text/html; charset=utf-8",
      );
    });
  });

  describe("#handleData", () => {
    it("should set status and Content-Type header", async () => {
      const req = createMockRequest();
      const res = createMockResponse(req);
      responder = new Responder(req, res);

      const result = await responder.handleData({ data: "payload" });
      expect(result).to.equal(true);
      expect(res.statusCode).to.equal(200);
      expect(res.getHeader("Content-Type")).to.equal(
        "text/html; charset=utf-8",
      );
    });
  });

  describe("#handleError", () => {
    it("should set status 500 and end the response when headers were not sent", () => {
      const req = createMockRequest();
      const res = createMockResponse(req);
      const logStub = sinon.stub(console, "log");
      responder = new Responder(req, res);

      responder.handleError(new Error("boom"));
      expect(res.statusCode).to.equal(500);
      expect(res.writableEnded).to.equal(true);
      expect(logStub).to.have.callCount(1);
    });

    it("should destroy the response when headers were already sent", () => {
      const req = createMockRequest();
      const res = createMockResponse(req);
      res.statusCode = 200;
      Object.defineProperty(res, "headersSent", { value: true });
      const destroyStub = sinon.stub(res, "destroy").returns(res);
      const endStub = sinon.stub(res, "end").returns(res);
      const logStub = sinon.stub(console, "log");
      responder = new Responder(req, res);

      responder.handleError(new Error("mid-stream boom"));
      expect(res.statusCode).to.equal(200);
      expect(endStub).to.have.callCount(0);
      expect(destroyStub).to.have.callCount(1);
      expect(logStub).to.have.callCount(1);
    });
  });

  describe("#isNotModified", () => {
    let result: { modified: number; etag: string };

    beforeEach(() => {
      responder = new Responder(createMockRequest(), createMockResponse());
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

    it("should be true when modified is 0 and if-modified-since is after epoch", () => {
      responder.req.headers["if-modified-since"] = new Date(1000).toUTCString();
      expect(responder.isNotModified({ modified: 0 })).to.equal(true);
    });

    it("should be false when modified or if-modified-since is an invalid date", () => {
      responder.req.headers["if-modified-since"] = "not-a-valid-date";
      expect(responder.isNotModified(result)).to.equal(false);

      responder.req.headers["if-modified-since"] = new Date(
        result.modified + 30000,
      ).toUTCString();
      expect(
        responder.isNotModified({ modified: "not-a-valid-date" }),
      ).to.equal(false);
    });
  });

  describe("#handleNotModified", () => {
    it("should return true, indicating it responded", () => {
      responder = new Responder(createMockRequest(), createMockResponse());

      const r = responder.handleNotModified();
      expect(r).to.equal(true);
    });
  });
});
