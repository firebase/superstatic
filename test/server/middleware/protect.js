var connect = require('connect');
var request = require('supertest');
var protect = require('../../../lib/server/middleware/protect');
var defaultSettings = require('../../../lib/server/settings/default');

describe('protect middleware', function() {
  var app;
  var settings;

  beforeEach(function () {
    app = connect();
    settings = defaultSettings.create();
    settings.configuration.auth =  'username:password';
  });

  it('skips middleware if auth is not set in configuration', function (done) {
    settings.configuration.auth = undefined;
    app.use(protect(settings));

    request(app)
      .get('/')
      .expect(404)
      .end(done);
  });

  it('requires http basic auth when environment is protected', function (done) {
    app.use(protect(settings));

    request(app)
      .get('/')
      .expect(401)
      .expect('WWW-Authenticate', 'Basic realm="Secure Area"')
      .end(done);
  });

  it('authorizes request if basic auth credentials match enviroment credentials', function (done) {
    app.use(function (req, res, next) {
      req.headers.authorization = 'Basic ' + new Buffer('username:password').toString('base64');
      next();
    });
    app.use(protect(settings));

    request(app)
      .get('/')
      .expect(404)
      .end(done);
  });

  it('requires authentication if auth is provided invalid credentials', function (done) {
    app.use(function (req, res, next) {
      req.headers.authorization = 'Basic ' + new Buffer('username:wrongpassword').toString('base64');
      next();
    });
    app.use(protect(settings));

    request(app)
      .get('/')
      .expect(401)
      .expect('WWW-Authenticate', 'Basic realm="Secure Area"')
      .end(done);
  });
});
