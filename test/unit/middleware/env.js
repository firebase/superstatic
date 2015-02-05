var request = require('supertest');
var connect = require('connect');
var query = require('connect-query');
var Router = require('router');

var env = require('../../../lib/middleware/env');
var responder = require('../../../lib/responder');

describe('env', function () {
  
  var app;
  var router;
  
  beforeEach(function () {
    
    router = Router();
    app = connect()
      .use(function (req, res, next) {
        
        responder({
          req: req,
          res: res,
          provider: {}
        });
        next();
      });
  });
  
  it('serves json', function (done) {
    
    env({
      data: {
        key: 'value'
      },
      router: router
    });
    
    app.use(router);
    
    request(app)
      .get('/__/env.json')
      .expect(200)
      .expect({
        key: 'value'
      })
      .expect('content-type', 'application/json; charset=utf-8')
      .end(done);
  });
  
  it('serves javascript', function (done) {
    
    env({
      data: {
        key: 'value'
      },
      router: router
    });
    
    app.use(router);
    
    request(app)
      .get('/__/env.js')
      .expect(200)
      .expect('content-type', 'application/javascript; charset=utf-8')
      .end(done);
  });
});