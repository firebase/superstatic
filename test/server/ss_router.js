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