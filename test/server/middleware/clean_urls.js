var path = require('path');
var setup = require('./_setup');
var expect = setup.expect;
var cleanUrls = require('../../../lib/server/middleware/clean_urls');

describe('#cleanUrls() middleware', function() {
  beforeEach(setup.beforeEach);
  
  it('determines if a route is a clean url', function (done) {
    var path1 = '/about';
    var path2 = '/assets/app';
    var path3 = '/about.html';
    
    this.req.url = '/about';
    
    cleanUrls(this.req, this.res, function () {
      expect(cleanUrls.internals.isCleanUrl(path1)).to.be(path1 + '.html');
      expect(cleanUrls.internals.isCleanUrl(path2)).to.be(false);
      expect(cleanUrls.internals.isCleanUrl(path3)).to.be(false);
      
      done();
    });
  });

  it('resolves a file path as a "clean url" version of a static asset', function (done) {
    var self = this;
    this.req.url = '/about';
    
    cleanUrls(this.req, this.res, function () {
      expect(self.req.superstatic).to.not.be(undefined);
      expect(self.req.superstatic.path).to.be(cleanUrls.internals.router._buildFilePath('/about.html'));
      
      done();
    });
  });
  
  it('redirects a static html file to the clean urls if clean urls are enabled', function () {
    this.req.url =  '/assets/about.html';
    cleanUrls(this.req, this.res, function () {});
    
    expect(this.res.writeHead.calledWith(301, { Location: '/assets/about' })).to.be(true);
    expect(this.res.end.called).to.be(true);
  });
  
  it('skips the middleware if the superstatic.path has already been set', function (done) {
    var self = this;
    this.req = {
      superstatic: { path: '/something.html' }
    };
    
    cleanUrls(this.req, this.res, function () {
      expect(self.req.superstatic.path).to.be('/something.html');
      done();
    });
  });
  
  it('404s the clean url version of the static http requests', function (done) {
    var self = this;
    this.req.ssRouter.cleanUrls = false;
    
    cleanUrls(this.req, this.res, function () {
      expect(self.req.superstatic).to.be(undefined);
      done();
    });
  });
});