var connect = require('connect');
var expect = require('expect.js');
var request = require('supertest');
var services = require('../../../lib/server/middleware/services');

describe.only('services middleware', function () {
  var app;
  
  beforeEach(function () {
    app = connect();
  });
  
  describe('skipping middleware', function () {
    
    beforeEach(function () {
      var serviceList = {
        service1: 'test'
      };
      
      app.use(services(serviceList, '__'));
    });
    
    it('skips if the route is not a service request', function (done) {
      request(app)
        .get('/')
        .expect(404)
        .end(done);
    });
    
    it('skips if the service does not exist', function (done) {
      request(app)
        .get('/__/no-service')
        .expect(404)
        .end(done);
    });
    
    it('skips if the requesting app is not configured to use the middleware', function (done) {
      request(app)
        .get('/__/service1/test')
        .expect(404)
        .end(done);
    });
    
  });
  
  describe('running services', function () {
    var service1Ran = false;
    var service2Ran = false;
    
    beforeEach(function () {
      service1Ran = false;
      service2Ran = false;
      
      var serviceList = {
        service2: function (req, res, next) {
          service2Ran = true;
          res.writeHead(200);
          res.write('service2');
          res.end();
        }
      };
      
      app.use(setConfig);
      app.use(services(serviceList, '__'));  
    });
    
    it('runs the service if it is configured in the app config', function (done) {
      request(app)
        .get('/__/service2/test2')
        .expect(200)
        .expect('service2')
        .expect(function () {
          expect(service2Ran).to.equal(true);
        })
        .end(done);
    });
    
    function setConfig (req, res, next) {
      req.config = {
        services: {
          // noService: {},
          // service1: {
          //   test1: {}
          // },
          service2: {
            test2: {}
          }
        }
      };
      next();
    }
    
  });
  
});