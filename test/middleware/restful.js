var connect = require('connect');
var request = require('supertest');
var expect = require('chai').expect;
var restful = require('../../lib/middleware/restful');
var defaultRoutes =  [
  {
    path: '/router',
    method: 'GET'
  }
];

describe('restful middleware', function() {
  var app;
  
  beforeEach(function () {
    app = connect();
  });
  
  it('skips the middleware if pathname has no match in routes', function (done) {
    app.use(restful(defaultRoutes));
    
    request(app)
      .get('/nope')
      .expect(404)
      .end(done);
  });
  
  it('skips the middleware if request method has no match in routes', function (done) {
    app.use(restful(defaultRoutes));
    
    request(app)
      .post('/router')
      .expect(404)
      .end(done);
  });
  
  it('runs each validate method in parallel and calls route handler as last item in chain', function (done) {
    var headersCalled = false;
    var routes = [{
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
    app.use(restful(routes));
    
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