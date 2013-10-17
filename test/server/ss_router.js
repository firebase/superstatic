var path = require('path');
var expect = require('expect.js');
var sinon = require('sinon');
var SsRouter = require('../../lib/server/ss_router');

describe.skip('#SsRouter()', function () {
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
  
  it('determines if a path is an html file', function () {
    var path = '/about.html';
    expect(this.router.isHtml(path)).to.be(true);
  });
  
  it('determines if file exists in file list', function () {
    var path = '/index.html';
    expect(this.router.isFile(path)).to.be(true);
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
  
  it('resolves the file path with a custom route', function (done) {
    var self = this;
    this.req = { url: '/custom-route' };
    this.router.customRoute(this.req, {}, function () {
      expect(self.req.superstatic).to.not.be(undefined);
      expect(self.req.superstatic.path).to.be(self.router._buildFilePath('/about.html'));
      done();
    });
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
});