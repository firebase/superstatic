var connect = require('connect');
var expect = require('chai').expect;
var request = require('supertest');
var query = require('connect-query');
var removeTrailingSlash = require('../../lib/middleware/remove_trailing_slash');
var defaultSettings = require('../../lib/settings/default');

describe('remove trailing slash middleware', function() {
  var app;
  var settings;
  
  beforeEach(function () {
    app = connect();
    settings = defaultSettings.create();
    
    app.use(function (req, res, next) {
      req.config = {
        index: 'index.html'
      };
      next();
    });
  });
  
  it('removes the trailing slash for a given url', function (done) {
    settings.isFile = function () {return false;};
    app.use(removeTrailingSlash(settings));
    
    request(app)
      .get('/about/')
      .expect(301)
      .expect('Location', '/about')
      .end(done);
  });
  
  it('does not redirect the root url because of the trailing slash', function (done) {
    app.use(removeTrailingSlash(settings));
    
    request(app)
      .get('/')
      .expect(404)
      .end(done);
  });
  
  it('does not redirect for directory index files', function (done) {
    app.use(removeTrailingSlash(settings));
    
    request(app)
      .get('/about/')
      .expect(404)
      .expect(function (data) {
        expect(data.req.path).to.equal('/about/');
      })
      .end(done);
  });
  
  it('redirects directory index to have a trailing slash', function (done) {
    app.use(removeTrailingSlash(settings));
    
    request(app)
      .get('/about')
      .expect(function (req) {
        expect(req.headers.location).to.equal('/about/');
      })
      .expect(301)
      .end(done);
  });
  
  it('preservers the query parameters on redirect', function (done) {
    settings.isFile = function () {return false;};
    app.use(query());
    app.use(removeTrailingSlash(settings));
    
    request(app)
      .get('/contact/?query=param')
      .expect(301)
      .expect('Location', '/contact?query=param')
      .end(done);
  });
  
  it('fails fast if no application config is available', function (done) {
    var app = connect()
      .use(removeTrailingSlash(settings))
      
    request(app)
      .get('/')
      .expect(404)
      .end(done);
  });
});