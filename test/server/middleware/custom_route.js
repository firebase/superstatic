var path = require('path');
var connect = require('connect');
var request = require('supertest');
var expect = require('expect.js');
var setup = require('./_setup');
var customRoute = require('../../../lib/server/middleware/custom_route');
var defaultFileStore = require('../../../lib/server/store/default');
var defaultSettings = require('../../../lib/server/settings/default');
var defaultRoutes = {
  '/test1': '/index.html',
  '/test3': '/test/dir'
};

describe('custom route middleware', function() {
  var app;
  var fileStore;
  var settings;
  
  beforeEach(function () {
    app = connect();
    fileStore = defaultFileStore.create();
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
    app.use(customRoute(settings, fileStore));
    
    request(app)
      .get('/test1')
      .expect(200)
      .expect('/index.html')
      .end(done);
  });
  
  it('serves the index file of a directory if mapped route is mapped to a directory', function (done) {
    app.use(customRoute(settings, fileStore));
    
    request(app)
      .get('/test3')
      .expect(200)
      .expect('/test/dir/index.html')
      .end(done);
  });
  
  it('serves the mapped route file for a custom route with a declared root', function (done) {
    app.use(function (req, res, next) {
      req.config.root = './public';
      next();
    });
    app.use(customRoute(settings, fileStore));
    
    request(app)
      .get('/test1')
      .expect(200)
      .expect('/public/index.html')
      .end(done);
  });
  
  it('skips the middleware if there is no custom route', function (done) {
    settings.configuration.routes = {};
    app.use(customRoute(settings, fileStore));
    
    request(app)
      .get('/no-route')
      .expect(404)
      .end(done);
  });
  
  it('skips the middleware if the custom route is for a file that does not exist', function (done) {
    settings.isFile = function () {return false;}
    app.use(customRoute(settings, fileStore));
    
    request(app)
      .get('/test1')
      .expect(404)
      .end(done);
  });
  
  describe('glob matching', function() {
    it('maps all paths to the same pathname', function (done) {
      settings.configuration.routes = {'**': 'index.html'};
      app.use(customRoute(settings, fileStore));
      
      request(app)
        .get('/any-route')
        .expect(200)
        .expect('/index.html')
        .end(done);
    });
    
    it('maps all requests to files in a given directory to the same pathname', function (done) {
      settings.configuration.routes = {'subdir/**': 'index.html'};
      app.use(customRoute(settings, fileStore));
      
      request(app)
        .get('/subdir/anything/here')
        .expect(200)
        .expect('/index.html')
        .end(done);
    });
  });
});