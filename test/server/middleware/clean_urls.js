var connect = require('connect');
var http = require('http');
var request = require('supertest');
var cleanUrls = require('../../../lib/server/middleware/clean_urls');
var defaultSettings = require('../../../lib/server/settings/default');
var defaultFileStore = require('../../../lib/server/store/default');
var PORT = '7777'

describe('clean urls middleware', function () {
  var settings;
  var fileStore;
  var server;
  var app;
  
  beforeEach(function () {
    app = connect();
    settings = defaultSettings.create();
    fileStore = defaultFileStore.create();
    settings.configuration.clean_urls = true;
    
    app.use(function (req, res, next) {
      res.send = function (pathname) {
        res.writeHead(200);
        res.end(pathname);
      }
      req.config = settings.configuration;
      
      next();
    });
  });
  
  it('redirects to the clean url path when static html file is requested', function (done) {
    app.use(cleanUrls(settings, fileStore));
    
    request(app)
      .get('/superstatic.html')
      .expect('Location', '/superstatic')
      .expect(301)
      .end(done);
  });
  
  it('it redirects and keeps the query string', function (done) {
    app.use(connect.query());
    app.use(cleanUrls(settings, fileStore));
    
    request(app)
      .get('/superstatic.html?key=value')
      .expect('Location', '/superstatic?key=value')
      .expect(301)
      .end(done);
  });
  
  it('serves the .html version of the clean url if clean_urls are on', function (done) {
    app.use(cleanUrls(settings, fileStore));
    
    request(app)
      .get('/superstatic')
      .expect(200)
      .expect('/superstatic.html')
      .end(done);
  });
  
  describe('skips middleware', function() {
    beforeEach(function () {
      app.use(function (req, res, next) {
        req.config.clean_urls = false;
        next();
      });
    });
    it('skips the middleware if clean_urls are turned off', function (done) {
      app.use(cleanUrls(settings, fileStore));
      
      request(app)
        .get('/superstatic.html')
        .expect(404)
        .end(done);
    });
    
    it('skips the middleware if it is the root path', function (done) {
      app.use(cleanUrls(settings, fileStore));
      
      request(app)
        .get('/')
        .expect(404)
        .end(done);
    });
    
    it('skips the middleware if it is not a file and clean_urls are on', function (done) {
      fileStore.exists = function () {return false;}
      
      app.use(function (req, res, next) {
        req.config.clean_urls = true;
        next();
      });
      app.use(cleanUrls(settings, fileStore));
      
      request(app)
        .get('/superstatic')
        .expect(404)
        .end(done);
    })
  });
});