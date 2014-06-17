var path = require('path');
var connect = require('connect');
var request = require('supertest');
var headers = require('../../lib/middleware/headers');
var defaultSettings = require('../../lib/settings/default');
var defaultHeaders = {
  '/test1': {
    'Content-Type': 'mime/type'
  },
  '/test3': {
    'Access-Control-Allow-Origin': 'https://www.example.net'
  },
  '/api/**': {
    'Access-Control-Allow-Origin': '*'
  }
};

function okay (req, res, next) {
  res.writeHead(200);
  res.end();
}

describe('cors middleware', function() {
  var app;
  
  beforeEach(function () {
    app = connect();
    settings = defaultSettings.create();
    settings.configuration.headers = defaultHeaders;
    
    app.use(function (req, res, next) {
      req.config = settings.configuration;      
      next();
    });
  });
  
  it('serves custom content types', function (done) {
    app.use(headers(settings));
    app.use(okay);

    request(app)
      .get('/test1')
      .expect(200)
      .expect('Content-Type', 'mime/type')
      .end(done);
  });
  
  it('serves custom access control headers', function (done) {
    app.use(headers(settings));
    app.use(okay);

    request(app)
      .get('/test3')
      .expect(200)
      .expect('Access-Control-Allow-Origin', 'https://www.example.net')
      .end(done);
  });
  
  it('uses routing rules', function (done) {
    app.use(headers(settings));
    app.use(okay);
    
    request(app)
      .get('/api/whatever/you/wish')
      .expect(200)
      .expect('Access-Control-Allow-Origin', '*')
      .end(done);
  });
});