var path = require('path');
var setup = require('./_setup');
var expect = setup.expect;
var static = require('../../../lib/server/middleware/static');

describe('#static() middleware', function() {
  beforeEach(setup.beforeEach);
  
  it('determines if non html file is static', function (done) {
    var path = '/assets/app.js';
    
    static(this.req, this.res, function () {
      expect(static.internals.isStatic(path)).to.not.be(false);
      done();
    });
  });
  
  it('ignores html files as static files', function (done) {
    var path = '/assets/about.html';
    
    static(this.req, this.res, function () {
      static.internals.router.cleanUrls = false;
      expect(static.internals.isStatic(path)).to.be(false)
      done();
    });
  });
  
  it('expresses html files as static if clean urls are not configured', function (done) {
    var path = '/about.html';
    
    static(this.req, this.res, function () {
      static.internals.router.cleanUrls = false;
      expect(static.internals.isStatic(path)).to.be(static.internals.router._buildFilePath(path));
      done();
    });
  });
  
  it('resolves a static file path when clean urls turned off', function (done) {
    var self = this;
    this.req.ssRouter.cleanUrls = false;
    
    static(this.req, this.res, function () {
      expect(self.req.superstatic).to.not.be(undefined);
      expect(self.req.superstatic.path).to.be(path.join(process.cwd(), '/about.html'));
      done();
    });
  });
  
  it('skips the middleware if the superstatic.path has already been set', function (done) {
    var self = this;
    this.req.superstatic = { path: '/something.html' };
    
    static(this.req, this.res, function () {
      expect(self.req.superstatic.path).to.be('/something.html');
      done();
    });
  });
})