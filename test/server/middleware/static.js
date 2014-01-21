var path = require('path');
var connect = require('connect');
var request = require('supertest');
var static = require('../../../lib/server/middleware/static');
var defaultFileStore = require('../../../lib/server/store/default');
var defaultSettings = require('../../../lib/server/settings/default');

describe('static middleware', function() {
  var app;
  var settings;
  var fileStore;
  
  beforeEach(function () {
    app = connect();
    fileStore = defaultFileStore.create();
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
    app.use(static(settings, fileStore));
    
    request(app)
      .get('/test.html')
      .expect(200)
      .expect('/test.html')
      .end(done);
  });
  
  it('skips the middleware if the file does not exist', function (done) {
    fileStore.exists = function () {return false;};
    app.use(static(settings, fileStore));
    
    request(app) 
      .get('/test.html')
      .expect(404)
      .end(done);
  });
  
  it('serves the directory index file if it is a path to a directory', function (done) {
    static.isDirectoryIndex = function () {return true;};
    app.use(static(settings, fileStore));
    
    request(app)
      .get('/public')
      .expect(200)
      .expect('/public/index.html')
      .end(done);
  });
  
  it('serves the static file when root directory is a sub director', function (done) {
    settings.configuration.root = './public';
    app.use(static(settings, fileStore));
    
    request(app)
      .get('/image.jpg')
      .expect(200)
      .expect('/public/image.jpg')
      .end(done);
  });
});