var connect = require('connect');
var request = require('supertest');
var expect = require('expect.js');
var restful = require('../../../lib/server/middleware/restful');

describe('restful middleware', function() {
  var app;
  
  beforeEach(function () {
    app = connect();
    app.use(function (req, res, next) {
      req.ss = {
        routes: [
          {
            path: '/router',
            method: 'GET'
          }
        ]
      };
      next();
    });
  });
  
  it('skips the middleware if pathname has no match in routes', function (done) {
    app.use(restful());
    
    request(app)
      .get('/nope')
      .expect(404)
      .end(done);
  });
  
  it('skips the middleware if request method has no match in routes', function (done) {
    app.use(restful());
    
    request(app)
      .post('/router')
      .expect(404)
      .end(done);
  });
  
  it('runs each validate method in parallel and calls route handler as last item in chain', function (done) {
    var headersCalled = false;
    
    app.use(function (req, res, next) {
      req.ss.routes = [{
        path: '/cache',
        method: 'GET',
        handler: function (req, res) {
          res.writeHead(200);
          res.end()
        },
        validate: {
          headers: function  (req, res, next) {
            headersCalled = true;
            next();
          }
        }
      }];
      next();
    });
    app.use(restful());
    
    request(app)
      .get('/cache')
      .expect(200)
      .end(function (err) {
        if (err) throw err;
        expect(headersCalled).to.equal(true);
        done();
      });
  });
});