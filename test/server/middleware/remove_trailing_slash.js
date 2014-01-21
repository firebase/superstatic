var connect = require('connect');
var request = require('supertest');
var removeTrailingSlash = require('../../../lib/server/middleware/remove_trailing_slash');

describe('remove trailing slash middleware', function() {
  var app;
  
  beforeEach(function () {
    app = connect();
  });
  
  it('removes the trailing slash for a given url', function (done) {
    app.use(removeTrailingSlash());
    
    request(app)
      .get('/about/')
      .expect(301)
      .expect('Location', '/about')
      .end(done);
  });
  
  it('does not redirect the root url because of the trailing slash', function (done) {
    app.use(removeTrailingSlash());
    
    request(app)
      .get('/')
      .expect(404)
      .end(done);
  });
  
  it('preservers the query parameters on redirect', function (done) {
    app.use(connect.query());
    app.use(removeTrailingSlash());
    
    request(app)
      .get('/contact/?query=param')
      .expect(301)
      .expect('Location', '/contact?query=param')
      .end(done);
  });
});