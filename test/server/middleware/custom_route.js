var path = require('path');
var connect = require('connect');
var request = require('supertest');
var customRoute = require('../../../lib/server/middleware/custom_route');
var defaultSettings = require('../../../lib/server/settings/default');
var defaultRoutes = {
  '/test1': '/index.html',
  '/test3': '/test/dir'
};

describe('custom route middleware', function() {
  var app;

  beforeEach(function () {
    app = connect();
    settings = defaultSettings.create();
    settings.configuration.routes = defaultRoutes

    app.use(function (req, res, next) {
      res.send = function (pathname) {
        res.writeHead(200);
        res.end(pathname);
      }
      req.config = settings.configuration;

      next();
    });
  });

  it('serves the mapped route file for a custom route', function (done) {
    app.use(customRoute(settings));

    request(app)
      .get('/test1')
      .expect(200)
      .expect('/index.html')
      .end(done);
  });

  it('serves the index file of a directory if mapped route is mapped to a directory', function (done) {
    app.use(customRoute(settings));

    request(app)
      .get('/test3')
      .expect(200)
      .expect('/test/dir/index.html')
      .end(done);
  });

  it('serves index.html if spa is on and route lacks extension', function (done) {
    settings.configuration.spa = true;
    app.use(customRoute(settings));

    request(app)
      .get('/test')
      .expect(200)
      .expect('/index.html')
      .end(done);
  });

  it('serves index.html if spa is on and nested route lacks extension', function (done) {
    settings.configuration.spa = true;
    app.use(customRoute(settings));

    request(app)
      .get('/foo/test')
      .expect(200)
      .expect('/index.html')
      .end(done);
  });

  it('404s if spa is on and route has extension that is not .html', function (done) {
    settings.configuration.spa = true;
    app.use(customRoute(settings));

    request(app)
      .get('/foo/test.foo')
      .expect(404)
      .end(done);
  });

  it('serves the mapped route file for a custom route with a declared root', function (done) {
    app.use(function (req, res, next) {
      req.config.root = './public';
      next();
    });
    app.use(customRoute(settings));

    request(app)
      .get('/test1')
      .expect(200)
      .expect('/public/index.html')
      .end(done);
  });

  it('skips the middleware if there is no custom route', function (done) {
    settings.configuration.routes = {};
    app.use(customRoute(settings));

    request(app)
      .get('/no-route')
      .expect(404)
      .end(done);
  });

  it('skips the middleware if the custom route is for a file that does not exist', function (done) {
    settings.isFile = function () {return false;}
    app.use(customRoute(settings));

    request(app)
      .get('/test1')
      .expect(404)
      .end(done);
  });

  it('skips the middleware if there is no config available', function (done) {
    app.use(function (req, res, next) {
      delete req.config;
      next();
    });
    app.use(customRoute(settings));

    request(app)
      .get('/test1')
      .expect(404)
      .end(done);
  });

  describe('glob matching', function() {
    it('maps all paths to the same pathname', function (done) {
      settings.configuration.routes = {'**': 'index.html'};
      app.use(customRoute(settings));

      request(app)
        .get('/any-route')
        .expect(200)
        .expect('/index.html')
        .end(done);
    });

    it('maps all requests to files in a given directory to the same pathname', function (done) {
      settings.configuration.routes = {'subdir/**': 'index.html'};
      app.use(customRoute(settings));

      request(app)
        .get('/subdir/anything/here')
        .expect(200)
        .expect('/index.html')
        .end(done);
    });
  });
});
