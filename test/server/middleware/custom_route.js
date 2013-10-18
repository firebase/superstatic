var path = require('path');
var setup = require('./_setup');
var expect = setup.expect;
var customRoute = require('../../../lib/server/middleware/custom_route');

describe('#customRoute() middleware', function() {
  beforeEach(function (done) {
    var self = this;
    
    setup.beforeEach.call(this, function () {
      self.req.connection = {};
      self.req.headers = { host: 'localhost:9999', referer: 'http://localhost:9999/some/path/index' };
      done();
    });
  });
  
  it('determines if a route is a custom route for non glob route definition', function (done) {
    var path1 = '/custom-route';
    var path2 = '/non-custom-route'
    
    customRoute(this.req, this.res, function () {
      expect(customRoute.internals.isCustomRoute(path1)).to.not.be(undefined);
      expect(customRoute.internals.isCustomRoute(path2)).to.be(undefined);
      
      done();
    });
  });
  
  it('determins if a route is a custom route for a glob definition', function (done) {
    var path1 = '/app/anything/something';
    var path2 = '/app/foo.html';
    var path3 = '/app';
    
    customRoute(this.req, this.res, function () {
      expect(customRoute.internals.isCustomRoute(path1)).to.not.be(undefined);
      expect(customRoute.internals.isCustomRoute(path2)).to.not.be(undefined);
      expect(customRoute.internals.isCustomRoute(path3)).to.not.be(undefined);
      
      done();
    });
  });

  it('resolves the file path with a custom route', function (done) {
    var self = this;
    this.req.url = '/custom-route' ;
    
    customRoute(this.req, this.res, function () {
      expect(self.req.superstatic).to.not.be(undefined);
      expect(self.req.superstatic.path).to.be(customRoute.internals.router._buildFilePath('/about.html'));
      done();
    });
  });
  
  it('skips the middleware if the superstatic.path has already been set', function (done) {
    var self = this;
    this.req = {
      superstatic: { path: '/something.html' }
    };
    
    customRoute(this.req, this.res, function () {
      expect(self.req.superstatic.path).to.be('/something.html');
      done();
    });
  });
  
  it('redirects to resolved url for a relative request url', function () {
    this.req.url = '/some/path/image.png';
    customRoute(this.req, this.res, function () {});
    expect(this.res.writeHead.calledWith(301, {Location: '/image.png'})).to.be(true);
    expect(this.res.end.called).to.be(true);
  });
  
  it('resolves a relative url according to the referer', function (done) {
    var self = this;
    
    customRoute(this.req, this.res, function () {
      var req1 = self.req;
      req1.url = '/some/path/image.png';
      var req2 = {
        headers: { host: 'localhost:9999', referer: 'http://localhost:9999/' },
        url: '/image.png',
        connection: {}
      };
      
      var resolvedUrl1 = customRoute.internals.resolveRelativePath(req1);
      var resolvedUrl2 = customRoute.internals.resolveRelativePath(req2);
      
      expect(resolvedUrl1).to.be('/image.png');
      expect(resolvedUrl2).to.be('/image.png');
      
      done();
    });
  });
});