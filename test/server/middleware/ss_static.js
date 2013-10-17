var path = require('path');
var setup = require('./_setup');
var expect = setup.expect;
var ssStatic = require('../../../lib/server/middleware/ss_static');

describe('#ssStatic() middleware', function() {
  beforeEach(setup.beforeEach);
  
  it('determines if non html file is static', function (done) {
    var path = '/assets/app.js';
    
    ssStatic(this.req, this.res, function () {
      expect(ssStatic.internals.isStatic(path)).to.not.be(false);
      done();
    });
  });
  
  it('ignores html files as static files', function (done) {
    var path = '/assets/about.html';
    
    ssStatic(this.req, this.res, function () {
      ssStatic.internals.router.cleanUrls = false;
      expect(ssStatic.internals.isStatic(path)).to.be(false)
      done();
    });
  });
  
  it('expresses html files as static if clean urls are not configured', function (done) {
    var path = '/about.html';
    
    ssStatic(this.req, this.res, function () {
      ssStatic.internals.router.cleanUrls = false;
      expect(ssStatic.internals.isStatic(path)).to.be(ssStatic.internals.router._buildFilePath(path));
      done();
    });
  });
  
  it('resolves a static file path when clean urls turned off', function (done) {
    var self = this;
    this.req.ssRouter.cleanUrls = false;
    
    ssStatic(this.req, this.res, function () {
      expect(self.req.superstatic).to.not.be(undefined);
      expect(self.req.superstatic.path).to.be(path.join(process.cwd(), '/about.html'));
      done();
    });
  });
})