var setup = require('./_setup');
var expect = setup.expect;
var customRoute = require('../../../lib/server/middleware/custom_route');

describe('#customRoute() middleware', function() {
  beforeEach(setup.beforeEachMiddleware);
  
  describe('skipping middleware', function() {
    it('skips if no config object available', function () {
      delete this.req.ss.config;
      setup.skipsMiddleware.call(this, customRoute);
    });
    
    it('skips middleware if superstatic path is alread set', function () {
      this.req.superstatic = { path: '/superstatic.html' };
      customRoute(this.req, this.res, this.next);
      expect(this.next.called).to.equal(true);
    });
    
    it('skips middleware if the url is not a custom route', function () {
      setup.skipsMiddleware.call(this, customRoute);
    });
  });
  
  it('sets the request path if url matches a custom route exactly', function () {
    this.req.url = '/custom-route'
    customRoute(this.req, this.res, this.next);
    
    expect(this.next.called).to.equal(true);
    expect(this.req.superstatic).to.eql({path: '/superstatic.html'});
  });
  
  it('sets the request path if url matches a custom route as a glob', function () {
    this.req.url = '/app/test/some/route';
    customRoute(this.req, this.res, this.next);
    
    expect(this.next.called).to.equal(true);
    expect(this.req.superstatic).to.eql({path: '/superstatic.html'});
  });
});