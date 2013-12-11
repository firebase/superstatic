var setup = require('./_setup');
var expect = setup.expect;
var cacheControl = require('../../../lib/server/middleware/cache_control');

describe('#cacheControl() middleware', function() {
  beforeEach(function (done) {
    var self = this;
    
    setup.beforeEachMiddleware.call(this, function () {
      self.req.superstatic = {path: '.tmp.html'};
      self.req.ss.settings.asRelativePath = function () { return '.tmp.html'; }
      done();
    });
  });
  
  it('sets the max age cache header if specified in config file', function () {
    this.req.ss.config.cache_control = { '.tmp.html': 1000 };
    this.req.superstatic.relativePath = '.tmp.html';
    cacheControl(this.req, this.res, this.next);
    expect(this.res.setHeader.calledWith('Cache-Control', 'public, max-age=1000')).to.be(true);
  });
  
  it('sets cache control to no-cache if false is specified in config file', function () {
    this.req.ss.config.cache_control = { '.tmp.html': false };
    this.req.superstatic.relativePath = '.tmp.html';
    cacheControl(this.req, this.res, this.next);
    expect(this.res.setHeader.calledWith('Cache-Control', 'no-cache')).to.be(true);
  });
  
  it('sets cache control to the passed string if specified in config file', function () {
    this.req.ss.config.cache_control = { '.tmp.html': 'private, max-age=300' };
    this.req.superstatic.relativePath = '.tmp.html';
    cacheControl(this.req, this.res, this.next);
    expect(this.res.setHeader.calledWith('Cache-Control', 'private, max-age=300')).to.be(true);
  });
  
  it('sets cache control to 24 hours by default', function() {
    cacheControl(this.req, this.res, this.next);
    expect(this.res.setHeader.calledWith('Cache-Control', 'public, max-age=3600')).to.be(true);
  });
})