var path = require('path');
var connect = require('connect');
var request = require('supertest');
var static = require('../../../lib/server/middleware/static');
var defaultSettings = require('../../../lib/server/settings/default');

describe('static middleware', function() {
  var app;
  var settings;
  
  beforeEach(function () {
    app = connect();
    settings = defaultSettings.create();
    
    static.isDirectoryIndex = function () {return false;};
    
    app.use(function (req, res, next) {
      res.send = function (pathname) {
        res.writeHead(200);
        res.end(pathname);
      }
      req.config = settings.configuration;
      
      next();
    });
  });
  
  it('servers a static file', function (done) {
    app.use(static(settings));
    
    request(app)
      .get('/test.html')
      .expect(200)
      .expect('/test.html')
      .end(done);
  });
  
  it('skips the middleware if the file does not exist', function (done) {
    settings.isFile = function () {return false;};
    app.use(static(settings));
    
    request(app) 
      .get('/test.html')
      .expect(404)
      .end(done);
  });
  
  it('skips the middleware if there is no config object available', function (done) {
    app.use(function (req, res, next) {
      delete req.config;
      next();
    });
    app.use(static(settings));
    
    request(app) 
      .get('/test.html')
      .expect(404)
      .end(done);
  });
  
  it('serves the directory index file if it is a path to a directory', function (done) {
    static.isDirectoryIndex = function () {return true;};
    app.use(static(settings));
    
    request(app)
      .get('/public')
      .expect(200)
      .expect('/public/index.html')
      .end(done);
  });
  
  it('serves the static file when root directory is a sub director', function (done) {
    settings.configuration.root = './public';
    app.use(static(settings));
    
    request(app)
      .get('/image.jpg')
      .expect(200)
      .expect('/public/image.jpg')
      .end(done);
  });
});