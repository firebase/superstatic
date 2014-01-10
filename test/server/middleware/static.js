var expect = require('expect.js');
var setup = require('./_setup');
var staticModule = require('../../../lib/server/middleware/static');

describe('static middleware', function() {
  beforeEach(function () {
    this.static = staticModule();
    staticModule.isDirectoryIndex = function () {
      return false;
    };
    
    setup.configure(this);
  });
  
  it('servers a static file', function () {
    callStatic(this);
    expect(this.res.send.calledWith('/superstatic.html')).to.be(true);
  });
  
  it('skips the middleware if the file does not exist', function () {
    this.req.settings.isFile = function () { return false; };
    callStatic(this);
    expect(this.next.called).to.be(true);
  });
  
  it('serves the directory index file if it is a path to a directory', function () {
    this.req.ss.pathname = '/public';
    staticModule.isDirectoryIndex = function () { return true; };
    callStatic(this);    
    expect(this.res.send.calledWith('/public/index.html')).to.be(true);
  });
  
});

function callStatic (ctx) {
  ctx.static(ctx.req, ctx.res, ctx.next);
}