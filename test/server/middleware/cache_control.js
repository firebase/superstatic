var setup = require('./_setup');
var expect = setup.expect;
var cacheControl = require('../../../lib/server/middleware/cache_control')();

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
    this.req.ss.config.max_age = { '.tmp.html': 1000 };
    this.req.superstatic.relativePath = '.tmp.html';
    cacheControl(this.req, this.res, this.next);
    expect(this.res.setHeader.calledWith('Cache-Control', 'max-age=1000')).to.be(true);
  });
  
  it('does not set the cache header if nothing is specified in config file', function () {
    cacheControl(this.req, this.res, this.next);
    expect(this.res.setHeader.calledWith('Cache-Control', 'max-age=1000')).to.be(false);
  });
})