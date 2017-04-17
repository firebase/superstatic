/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

'use strict';

var Responder = require('../../lib/responder');
var RSVP = require('rsvp');
var _ = require('lodash');
var chai = require('chai');
var sinon = require('sinon');
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));
var expect = chai.expect;

describe('Responder', function() {
  var responder;

  describe('#handle', function() {
    beforeEach(function() {
      responder = new Responder({}, {setHeader: _.noop, end: _.noop}, {});
    });

    it('should resolve as false with an empty stack', function() {
      return expect(responder.handle([])).to.eventually.eq(false);
    });

    it('should call the stack if an array is passed', function() {
      return expect(responder.handle([{data: 'abcdef'}])).to.eventually.eq(true);
    });

    it('should call through to handleFile with a string', function() {
      var stub = sinon.stub(responder, 'handleFile').returns(RSVP.resolve(true));
      responder.handle('abc/def.html');
      expect(stub).to.have.been.calledWith({file: 'abc/def.html'});
    });

    it('should call through to handleFile with a file object', function() {
      var stub = sinon.stub(responder, 'handleFile').returns(RSVP.resolve(true));
      responder.handle({file: 'abc/def.html'});
      expect(stub).to.have.been.calledWith({file: 'abc/def.html'});
    });

    it('should call through to handleData with a data object', function() {
      var stub = sinon.stub(responder, 'handleData').returns(RSVP.resolve(true));
      var obj = {data: 'abc def'};
      responder.handle(obj);
      expect(stub).to.have.been.calledWith(obj);
    });

    it('should call through to handleRedirect with a redirect object', function() {
      var stub = sinon.stub(responder, 'handleRedirect').returns(RSVP.resolve(true));
      var obj = {redirect: '/'};
      responder.handle(obj);
      expect(stub).to.have.been.calledWith(obj);
    });

    it('should call through to handleRewrite with a rewrite object', function() {
      var stub = sinon.stub(responder, 'handleRewrite').returns(RSVP.resolve(true));
      var obj = {rewrite: {}};
      responder.handle(obj);
      expect(stub).to.have.been.calledWith(obj);
    });
  });

  describe('#_handle', function() {
    beforeEach(function() {
      responder = new Responder({}, {setHeader: _.noop, end: _.noop}, {});
    });

    it('should reject with an unrecognized payload', function() {
      return expect(responder._handle({foo: 'bar'})).to.be.rejectedWith('is not a recognized responder directive');
    });
  });

  describe('#handleRewrite', function() {
    it('should call through to a registered custom rewriter', function() {
      var out;
      responder = new Responder({}, {setHeader: _.noop, end: function(data) { out = data; }}, {
        rewriters: {
          message: function(rewrite) {
            return RSVP.resolve({data: rewrite.message, contentType: 'text/plain', status: 200});
          }
        }
      });

      return responder.handleRewrite({rewrite: {message: 'hi'}}).then(function(result) {
        expect(result).to.be.true;
        expect(out).to.equal('hi');
      });
    });
  });

  describe('#handleMiddleware', function() {
    var rq;
    beforeEach(function() {
      rq = {};
      responder = new Responder(rq, {setHeader: _.noop, end: _.noop}, {});
    });

    it('should call the middleware', function(done) {
      responder.handleMiddleware(function() {
        done();
      });
    });

    it('should resolve false if next is called', function() {
      return responder.handleMiddleware(function(req, res, next) {
        next();
      }).then(function(result) {
        expect(result).to.be.false;
      });
    });
  });

  describe('#handleFile', function() {
    var req = {};
    var res = {};
    var stub;

    beforeEach(function() {
      stub = sinon.stub();
      responder = new Responder(req, res, {
        provider: stub
      });
    });

    it('should call through to provider', function() {
      stub.returns(RSVP.resolve({}));
      responder.handleFile({file: 'abc/def.html'});
      expect(stub).to.have.been.calledWith(req, 'abc/def.html');
    });
  });

  describe('#isNotModified', function() {
    var result;

    beforeEach(function() {
      responder = new Responder({headers: {}}, {}, {});
      result = {
        modified: Date.now(),
        etag: 'abcdef'
      };
    });

    it('should be false if there are no if-modified-since or if-none-match headers', function() {
      expect(responder.isNotModified(result)).to.be.false;
    });

    it('should be false if there is a non-matching etag', function() {
      responder.req.headers['if-none-match'] = 'defabc';
      expect(responder.isNotModified(result)).to.be.false;
    });

    it('should be true if there is a matching etag', function() {
      responder.req.headers['if-none-match'] = 'abcdef';
      expect(responder.isNotModified(result)).to.be.true;
    });

    it('should be true if there is an if-modified-since after the modified', function() {
      responder.req.headers['if-modified-since'] = new Date(result.modified + 30000).toUTCString();
      expect(responder.isNotModified(result)).to.be.true;
    });

    it('should be false if there is an if-modified-since before the modified', function() {
      responder.req.headers['if-modified-since'] = new Date(result.modified - 30000).toUTCString();
      expect(responder.isNotModified(result)).to.be.false;
    });
  });
});
