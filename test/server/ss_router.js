var path = require('path');
var expect = require('expect.js');
var sinon = require('sinon');
var SsRouter = require('../../lib/server/ss_router');

describe('#SsRouter()', function () {
  beforeEach(function () {
    this.req = {
      url: '/about.html'
    };
    
    this.res = {
      writeHead: sinon.spy(),
      end: sinon.spy()
    };
    
    this.router = new SsRouter({
      settings: {
        cwd: process.cwd(),
        configuration: {
          root: './',
          clean_urls: true,
          routes: {
            'custom-route': 'about.html',
            'app**': 'index.html',
            'app/**': 'index.html'
          },
          files: [
            '/index.html',
            '/about.html',
            '/assets/app.js',
            '/contact/index.html',
            '/app/index.html',
            '/app/css/style.css',
            '/app/js/app.js'
          ]
        }
      }
    });
  });
  
  it('defines default cleanUrls attribute', function () {
    expect(this.router.cleanUrls).to.not.be(undefined);
  });
  
  it('defines default routes attribute', function () {
    expect(this.router.routes).to.not.be(undefined);
  });
  
  it('builds the file url', function () {
    var filePath = this.router._buildFilePath('/about.html');
    expect(filePath).to.be(path.join(process.cwd(), this.router.settings.configuration.root, '/about.html'));
  });
  
  it('determines if non html file is static', function () {
    var path = '/assets/app.js';
    expect(this.router.isStatic(path)).to.not.be(false);
  });
  
  it('ignores html files as static files', function () {
    var path = '/assets/about.html';
    this.router.cleanUrls = false;
    expect(this.router.isStatic(path)).to.be(false)
  });
  
  it('determines if a path is an html file', function () {
    var path = '/about.html';
    expect(this.router.isHtml(path)).to.be(true);
  });
  
  it('expresses html files as static if clean urls are not configured', function () {
    var path = '/about.html';
    this.router.cleanUrls = false;
    expect(this.router.isStatic(path)).to.be(this.router._buildFilePath(path));
  });
  
  it('determines if file exists in file list', function () {
    var path = '/index.html';
    expect(this.router.isFile(path)).to.be(true);
  });
  
  it('determines if route resolves as directory serving the index.html file', function () {
    var path1 = '/contact';
    var path2 = '/about';
    
    expect(this.router.isDirectoryIndex(path1)).to.be('/contact/index.html');
    expect(this.router.isDirectoryIndex(path2)).to.be(false);
  });
  
  it('determines if a route is a clean url', function () {
    var path1 = '/about';
    var path2 = '/assets/app';
    var path3 = '/about.html';
    
    expect(this.router.isCleanUrl(path1)).to.be(path1 + '.html');
    expect(this.router.isCleanUrl(path2)).to.be(false);
    expect(this.router.isCleanUrl(path3)).to.be(false);
  });
  
  it('determines if a route is a custom route for non glob route definition', function () {
    var path1 = '/custom-route';
    var path2 = '/non-custom-route'
    
    expect(this.router.isCustomRoute(path1)).to.not.be(undefined);
    expect(this.router.isCustomRoute(path2)).to.be(undefined);
  });
  
  it('determins if a route is a custom route for a glob definition', function () {
    var path1 = '/app/anything/something';
    var path2 = '/app/foo.html';
    var path3 = '/app';
    
    expect(this.router.isCustomRoute(path1)).to.not.be(undefined);
    expect(this.router.isCustomRoute(path2)).to.not.be(undefined);
    expect(this.router.isCustomRoute(path3)).to.not.be(undefined);
  });

  it('resolves a static file path when clean urls turned off', function (done) {
    var self = this;
    this.router.cleanUrls = false;
    this.router.static(this.req, {}, function () {
      expect(self.req.superstatic).to.not.be(undefined);
      expect(self.req.superstatic.path).to.be(path.join(process.cwd(), '/about.html'));
      done();
    });
  });
  
  it('resolves the file path with a custom route', function (done) {
    var self = this;
    this.req = { url: '/custom-route' };
    this.router.customRoute(this.req, {}, function () {
      expect(self.req.superstatic).to.not.be(undefined);
      expect(self.req.superstatic.path).to.be(self.router._buildFilePath('/about.html'));
      done();
    });
  });
  
  it('resolves the file path as a directory index', function (done) {
    var self = this;
    this.req = { url: '/contact' };
    
    this.router.directoryIndex(this.req, {}, function () {
      expect(self.req.superstatic).to.not.be(undefined);
      expect(self.req.superstatic.path).to.be(self.router._buildFilePath('/contact/index.html'));
      done();
    });
  });
  
  it('redirects to a directory base path if the path, as a clean url, ends with index', function () {
    this.req = { url: '/contact/index' };
    this.router.directoryIndex(this.req, this.res, sinon.spy());
    expect(this.res.writeHead.calledWith(301, { Location: '/contact' })).to.be(true);
    expect(this.res.end.called).to.be(true);
  });
  
  it('resolves a file path as a "clean url" version of a static asset', function (done) {
    var self = this;
    this.req = { url: '/about' };
    this.router.cleanUrl(this.req, this.res, function () {
      expect(self.req.superstatic).to.not.be(undefined);
      expect(self.req.superstatic.path).to.be(self.router._buildFilePath('/about.html'));
      
      done();
    });
  });
  
  it('redirects a static html file to the clean urls if clean urls are enabled', function () {
    this.req = { url: '/assets/about.html' };
    this.router.cleanUrl(this.req, this.res, sinon.spy());
    expect(this.res.writeHead.calledWith(301, { Location: '/assets/about' })).to.be(true);
    expect(this.res.end.called).to.be(true);
  });
  
  it('skips the middleware if the superstatic.path has already been set', function (done) {
    var self = this;
    this.req = {
      superstatic: {
        path: '/something.html'
      }
    };
    
    this.router.directoryIndex(this.req, {}, function () {
      expect(self.req.superstatic.path).to.be('/something.html');
      done();
    });
  });
  
  describe('#notFound()', function() {
    it('returns 404 if the response path does not exists', function () {
      this.router.notFound(this.req, this.res, function () {});
      expect(this.res.writeHead.calledWith(404)).to.be(true);
    });
    
    it.skip('returns a 404 - not found response if a requested file does not exist', function (done) {
      done();
    });
  });
  
  it.skip('redirects if path does not contain a trailing slash', function () {
    this.req.url = '/about';
    this.router.forceTrailingSlash(this.req, this.res, function () {});
    expect(this.res.writeHead.calledWith(301, {Location: '/about/'})).to.be(true);
  });
  
  it.skip('does not redirect if a static file does not have a trailing slash', function () {
    var callbackSpy = sinon.spy();
    this.req.url = '/about.png';
    this.router.forceTrailingSlash(this.req, this.res, callbackSpy);
    expect(callbackSpy.called).to.be(true);
  });
  
  it('removes the trailing slash for a given url', function () {
    this.req.url = '/about/';
    this.router.removeTrailingSlash(this.req, this.res, function () {});
    expect(this.res.writeHead.calledWith(301, {Location: '/about'})).to.be(true);
    expect(this.res.end.called).to.be(true);
  });
  
  it('does not redirect the root url because of the trailing slash', function () {
    var callbackSpy = sinon.spy();
    this.req.url = '/'
    this.router.removeTrailingSlash(this.req, this.res, callbackSpy);
    expect(callbackSpy.called).to.be(true);
  });
});