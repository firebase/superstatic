var setup = require('./_setup');
var expect = setup.expect;
var cleanUrls = require('../../../lib/server/middleware/clean_urls');

describe.only('#cleanUrls() middleware', function() {
  beforeEach(setup.beforeEachMiddleware);
  
  describe('skipping middleware', function() {
    it('skips if no config object available', function () {
      delete this.req.ss.config;
      setup.skipsMiddleware.call(this, cleanUrls);
    });
    
    it('skips if clean urls are turned off', function () {
      setup.skipsMiddleware.call(this, cleanUrls);
    });

    it('skips middleware if it is not an html file and clean urls are on', function () {
      this.req.ss.config.config.clean_urls = true;
      this.req.url = '/image.png';
      setup.skipsMiddleware.call(this, cleanUrls);
    });
    
    it('skips middleware if superstatic path is alread set', function () {
      this.req.superstatic = { path: '/index.html' };
      cleanUrls(this.req, this.res, this.next);
      expect(this.next.called).to.equal(true);
    });
  });
  
  it('redirects if url is an html file and clean urls are turned on', function () {
    this.req.ss.config.config.clean_urls = true;
    cleanUrls(this.req, this.res, this.next);
    
    expect(this.res.writeHead.calledWith(301, {Location: '/about'}));
    expect(this.res.end.called).to.equal(true);
  });
  
  it('sets the request path when clean urls are turned on and it is a clean url', function () {
    this.req.url = '/about';
    this.req.ss.config.config.clean_urls = true;
    cleanUrls(this.req, this.res, this.next);
    
    expect(this.next.called).to.equal(true);
    expect(this.req.superstatic).to.eql({path: '/about.html'});
  });
});