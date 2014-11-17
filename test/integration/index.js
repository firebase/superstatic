var _ = require('lodash');
var superstatic = require('../../');
var expect = require('chai').expect;
var request = require('supertest');
var ROOT_DIR = __dirname + '/fixtures';

describe('serving requests', function () {
  describe('basic', function () {
    var app;
    
    beforeEach(function (done) {
      app = superstatic({
        debug: false,
        config: {
          root: ROOT_DIR,
          error_page: 'error.html'
        }
      });
      
      app.listen(done);
    });
    
    afterEach(function (done) {
      app.close(done);
    });
    
    it('gets the index file', function (done) {
      request(app)
        .get('/')
        .expect('index.html')
        .expect('Content-Type', 'text/html; charset=UTF-8')
        .expect(200)
        .end(done);
    });
    
    it('gets an html file', function (done) {
      request(app)
        .get('/about.html')
        .expect('about.html')
        .expect(200)
        .end(done);
    });
    
    it('gets a js file', function (done) {
      request(app)
        .get('/app.js')
        .expect('// app.js')
        .expect(200)
        .expect('Content-Type', 'application/javascript')
        .end(done);
    });
    
    it('gets a css file', function (done) {
      request(app)
        .get('/style.css')
        .expect('/* style.css */')
        .expect(200)
        .expect('Content-Type', 'text/css; charset=UTF-8')
        .end(done);
    });
  });

  describe('with settings', function () {
    describe('services', function () {
      //
    });
    
    it('redirects with 301', function (done) {
        serverWithConfig({
          redirects: {
            '/from': '/to'
          }
        }, function (err, app) {
          request(app)
            .get('/from')
            .expect(301)
            .expect('Location', '/to')
            .end(endApp(app, done));
        });
    });
    
    describe('trailing slash', function () {
      it('removes the trailing slash', function (done) {
        serverWithConfig({}, function (err, app) {
          request(app)
            .get('/slash/')
            .expect(301)
            .expect('Location', '/slash')
            .end(endApp(app, done));
        });
      });
      
      it('keeps the trailing slash with a directory index file', function (done) {
        serverWithConfig({}, function (err, app) {
          request(app)
            .get('/sub/')
            .expect(200)
            .expect('sub/index.html')
            .end(endApp(app, done));
        });
      });
    });
    
    describe('basic auth', function () {
      // TODO: refactor this, then write the tests
    });
    
    it('sets the headers', function (done) {
      serverWithConfig({
        headers: {
          '/test': {
            'anything': 'here'
          }
        }
      }, function (err, app) {
        request(app)
          .get('/test')
          .expect('anything', 'here')
          .end(endApp(app, done));
      });
    });
    
    it('sets the response cache', function (done) {
      serverWithConfig({
        cache_control: {
          '/test': 1234
        }
      }, function (err, app) {
        request(app)
          .get('/test')
          .expect('Cache-Control', 'public, max-age=1234')
          .end(endApp(app, done));
      });
    });
    
    it('sets the default cache time in response', function (done) {
      serverWithConfig({}, function (err, app) {
        request(app)
          .get('/test')
          .expect('Cache-Control', 'public, max-age=300')
          .end(endApp(app, done));
      });
    });
    
    describe('environment variables', function () {
      // TODO: test this
    });
    
    describe('clean urls', function () {
      
      it('does not redirect if clean urls are not configured', function (done) {
        serverWithConfig({}, function (err, app) {
          request(app)
            .get('/about')
            .expect(404)
            .end(endApp(app, done));
        });
      });
      
      it('redirects to a clean url when it is an html file', function (done) {
        serverWithConfig({
          clean_urls: true
        }, function (err, app) {
          request(app)
            .get('/about.html')
            .expect(301)
            .expect('Location', '/about')
            .end(endApp(app, done));
        });
      });
      
      it('serves the html file', function (done) {
        serverWithConfig({
          clean_urls: true
        }, function (err, app) {
          request(app)
            .get('/about')
            .expect(200)
            .expect('about.html')
            .expect('content-type', 'text/html; charset=UTF-8')
            .end(endApp(app, done));
        });
      });
      
      it('redirects with an array of glob-like rules', function (done) {
        serverWithConfig({
          clean_urls: ['/about**']
        }, function (err, app) {
          request(app)
            .get('/about')
            .expect(200)
            .expect('about.html')
            .expect('content-type', 'text/html; charset=UTF-8')
            .end(endApp(app, done));
        });
      });
      
      it('serves the html file from glob-like rules', function (done) {
        serverWithConfig({
          clean_urls: ['/about.html']
        }, function (err, app) {
          request(app)
            .get('/about')
            .expect(200)
            .expect('about.html')
            .expect('content-type', 'text/html; charset=UTF-8')
            .end(endApp(app, done));
        });
      });
    });
    
    describe('custom routes', function () {
      
      it('serves custom route', function (done) {
        serverWithConfig({
          routes: {
            '/route': 'index.html'
          }
        }, function (err, app) {
          request(app)
            .get('/route')
            .expect(200)
            .expect('index.html')
            .end(endApp(app, done));
        });
      });
      
      it('services static file if no route', function (done) {
        serverWithConfig({
          routes: {
            '/route': 'index.html'
          }
        }, function (err, app) {
          request(app)
            .get('/about.html')
            .expect(200)
            .expect('about.html')
            .end(endApp(app, done));
        });
      });
      
      it('serves custom route with negation', function (done) {
        serverWithConfig({
          routes: {
            '!/ignore': 'index.html'
          }
        }, function (err, app) {
          
          request(app)
            .get('/route')
            .expect(200)
            .expect('index.html')
            .end(endApp(app, done));
        });
      });
    });
    
    it('serves default favicon', function (done) {
      serverWithConfig({}, function (err, app) {
        request(app)
          .get('/favicon.ico')
          .expect(200)
          .end(endApp(app, done));
      });
    });
    
    describe('serving eror pages', function () {
      it('serves an error page based on the config file', function (done) {
        serverWithConfig({
          error_page: 'error.html'
        }, function (err, app) {
          request(app)
            .get('/asdfasdf')
            .expect('error.html')
            .expect(404)
            .end(endApp(app, done));
        });
      });
      
      it('serves a default error page described in settings', function (done) {
        serverWithConfig({}, function (err, app) {
          app.settings._defaults.error_page = ROOT_DIR + '/error.html';
          
          request(app)
            .get('/asdfasdf')
            .expect('error.html')
            .expect(404)
            .end(endApp(app, done));
        });
      });
    });
    
    
    function serverWithConfig(config, done) {
      var app = superstatic({
        debug: false,
        config: _.extend({
          root: ROOT_DIR
        }, config)
      })
      app.listen(function (err) {
        done(err, app);
      });
    }
    
    function endApp (app, done) {
      return function (err) {
        if (err) {
          app.close(function () {
            done(err);
          });
        }
        else {
          app.close(done);
        }
      };
    }
  });
});