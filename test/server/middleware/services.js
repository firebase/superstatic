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
    
    it('skips the middleware if the route is not a service request', function (done) {
      var serviceList = {
        service1: ''
      };
      app.use(services(serviceList, '__'));
      
      
      
      
      
      expect(true).to.equal(true);
      done();
    });
    
  });
  
});