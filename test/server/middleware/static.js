var setup = require('./_setup');
var expect = setup.expect;
var static = require('../../../lib/server/middleware/static');

describe('#static() middleware', function() {
  beforeEach(setup.beforeEachMiddleware);
  
  describe('skipping middleware', function() {
    it('skips middleware if no config object available', function () {
      delete this.req.ss.config;
      setup.skipsMiddleware.call(this, static);
    });
    
    it('skips middleware if superstatic path is alread set', function () {
      this.req.superstatic = { path: '/superstatic.html' };
      static(this.req, this.res, this.next);
      expect(this.next.called).to.equal(true);
    });
    
    it('skips middleware if path is an html file and clean urls are turned on', function () {
      this.req.ss.config.config.clean_urls = true;
      setup.skipsMiddleware.call(this, static);
    });
    
    it('skips middleware if path is not a static file', function () {
      this.req.url = '/superstatic';
      setup.skipsMiddleware.call(this, static);
    });
  });
  
  it('sets the request path if the file is static and clean urls are not turned on', function () {
    this.req.url = '/superstatic.html';
    this.req.ss.config.cwd = 'cwd';
    this.req.ss.config.root = 'root';
    this.req.ss.config.config.clean_urls = false;
    static(this.req, this.res, this.next);
    
    expect(this.req.superstatic).to.eql({path: '/cwd/root/superstatic.html'});
  });
});