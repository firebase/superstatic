var connect = require('connect');
var request = require('supertest');
var fs = require('fs');
var path = require('path');
var expect = require('expect.js');
var mkdirp = require('mkdirp');
var rmdir = require('rmdir');
var notFound = require('../../../lib/server/middleware/not_found');
var sender = require('../../../lib/server/middleware/sender');
var defaultFileStore = require('../../../lib/server/store/default');
var notFoundTplPath = path.resolve(__dirname, '../../../lib/server/templates/not_found.html');
var notFoundTpl = fs.readFileSync(notFoundTplPath).toString();
var defaultSettings = require('../../../lib/server/settings/default');

describe('not found middleware', function() {
  var app;
  var settings;
  
  beforeEach(function () {
    app = connect();
    settings = defaultSettings.create();
    
    // Override where it looks for the file
    // When in production, it looks for the file relative
    // to the root directory
    settings._rootCwd = process.cwd();
    
    app.use(sender(defaultFileStore.create()));
    app.use(function (req, res, next) {
      req.config = {
        root: './',
        error_page: notFoundTplPath
      };
    
      next();
    });
  });
  
  it('serves the default 404 page', function (done) {
    app.use(function (req, res, next) {
      delete req.config.error_page;
      next();
    });
    app.use(notFound(settings));
    
    request(app)
      .get('/not-found')
      .expect(404)
      .expect(notFoundTpl)
      .end(done)
  });
  
  it('serves a custom 404 page', function (done) {
    app.use(function (req, res, next) {
      req.config.error_page = 'error.html';
      next();
    });
    app.use(notFound(settings));
    
    fs.writeFileSync('error.html', 'error');
    
    request(app)
      .get('/asdfasdf')
      .expect('error')
      .expect(404)
      .end(function (err) {
        fs.unlinkSync('error.html');
        
        if (err) throw err;
        done();
      });
  });
  
  it('serves a custom 404 page when the root is set to a sub-directory, relative to the root directory', function (done) {
    var rootDir = '.tmp';
    
    settings.configuration.root = rootDir;
    
    app.use(function (req, res, next) {
      req.config.root = rootDir;
      req.config.error_page = 'error.html';
      next();
    });
    app.use(notFound(settings));
    
    mkdirp.sync(rootDir);
    fs.writeFileSync(rootDir + '/error.html', 'error');
    
    request(app)
      .get('/not-found')
      .expect('error')
      .expect(404)
      .end(function (err) {
        rmdir(rootDir, function () {
          if (err) throw err;
          done();
        });
      });
  });
  
  it('serves the default 404 page if the configured file does not exist', function (done) {
    settings.isFile = function () {
      return false;
    };
    
    app.use(notFound(settings));
    
    request(app)
      .get('/not-found')
      .expect(notFoundTpl)
      .end(done)
  });
  
  it('proxies a remote 404 page', function (done) {
    var remoteErrorPageUrl = 'http://localhost:4567';
    
    app.use(function (req, res, next) {
      res.send = function (url) {
        expect(url).to.equal(remoteErrorPageUrl);
        done();
      };
      
      req.config.error_page = remoteErrorPageUrl
      next();
    });
    app.use(notFound(settings));
    
    request(app)
      .get('/not-found')
      .expect(404)
      .end(function () {
        /* test is done above */
      });
  });
});