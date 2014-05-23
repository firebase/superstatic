var connect = require('connect');
var request = require('supertest');
var cacheControl = require('../../lib/middleware/cache_control');
var caches = {
  'index.html': 1000,
  'none.html': false,
  'private.html': 'private, max-age=300'
};

describe('cache control middleware', function() {
  var app;
  
  beforeEach(function () {
    app = connect();
    app.use(function (req, res, next) {
      req.config = {cache_control: caches};
      next();
    });
  });
  
  it('sets the max age cache header if specified in config file', function (done) {
    app.use(cacheControl());
    
    request(app)
      .get('/index.html')
      .expect('Cache-Control', 'public, max-age=1000')
      .end(done);
  });
  
  it('sets cache control to no-cache if false is specified in config file', function (done) {
    app.use(cacheControl());
    
    request(app)
      .get('/none.html')
      .expect('Cache-Control', 'no-cache')
      .end(done);
  });
  
  it('sets cache control to the passed string if specified in config file', function (done) {
    app.use(cacheControl());
    
    request(app)
      .get('/private.html')
      .expect('Cache-Control', 'private, max-age=300')
      .end(done);
  });
  
  it('sets cache control to 5 minutes? by default', function(done) {
    app.use(cacheControl());
    
    request(app)
      .get('/default.html')
      .expect('Cache-Control', 'public, max-age=300')
      .end(done);
  });
  
  it('sets the cache control to 5 minutes? by default if no config is provided', function (done) {
    app.use(function (req, res, next) {
      delete req.config;
      next();
    });
    app.use(cacheControl());
    
    request(app)
      .get('/default.html')
      .expect('Cache-Control', 'public, max-age=300')
      .end(done);
  });
});
