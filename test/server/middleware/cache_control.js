var setup = require('./_setup');
var expect = require('expect.js');
var cacheControl = require('../../../lib/server/middleware/cache_control');

describe('cache control middleware', function() {
  beforeEach(function () {
    this.cacheControl = cacheControl();
    setup.configure(this);
    
    this.req.config.cache_control = {
      'superstatic.html': 1000,
      'none.html': false,
      'private.html': 'private, max-age=300'
    };
  });
  
  it('sets the max age cache header if specified in config file', function () {
    this.cacheControl(this.req, this.res, this.next);
    expect(this.res.setHeader.calledWith('Cache-Control', 'public, max-age=1000')).to.equal(true);
  });
  
  it('sets cache control to no-cache if false is specified in config file', function () {
    this.req.ss.pathname = '/none.html';
    this.cacheControl(this.req, this.res, this.next);
    expect(this.res.setHeader.calledWith('Cache-Control', 'no-cache')).to.be(true);
  });
  
  it('sets cache control to the passed string if specified in config file', function () {
    this.req.ss.pathname = '/private.html';
    this.cacheControl(this.req, this.res, this.next);
    expect(this.res.setHeader.calledWith('Cache-Control', 'private, max-age=300')).to.be(true);
  });
  
  // FIXME: not passing!!!!!!!!!!!!
  
  it('sets cache control to 24 hours by default', function() {
    this.req.ss.pathname = '/default.html';
    this.cacheControl(this.req, this.res, this.next);
    expect(this.res.setHeader.calledWith('Cache-Control', 'public, max-age=3600')).to.be(true);
  });
});