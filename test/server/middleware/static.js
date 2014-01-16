var expect = require('expect.js');
var path = require('path');
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
    expect(this.res.send.calledWith('/superstatic.html')).to.equal(true);
  });
  
  it('skips the middleware if the file does not exist', function () {
    this.req.settings.isFile = function () { return false; };
    callStatic(this);
    expect(this.next.called).to.equal(true);
  });
  
  it('serves the directory index file if it is a path to a directory', function () {
    this.req.ss.pathname = '/public';
    staticModule.isDirectoryIndex = function () { return true; };
    callStatic(this);    
    expect(this.res.send.calledWith('/public/index.html')).to.equal(true);
  });
  
  it('serves the static file when root directory is a sub director', function () {
    var self = this;
    this.req.config.root = './public';
    this.req.ss.pathname = '/image.jpg'
    this.req.rootPathname = function (pathname) {
      return path.join('/', self.req.config.root, pathname);
    };
    
    callStatic(this);
    expect(this.res.send.calledWith('/public/image.jpg')).to.equal(true);
  });
});

function callStatic (ctx) {
  ctx.static(ctx.req, ctx.res, ctx.next);
}