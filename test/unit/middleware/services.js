var fs = require('fs-extra');
var request = require('supertest');
var connect = require('connect');
var expect = require('chai').expect;

var services = require('../../../lib/middleware/services');
var dfs = require('../../../lib/dfs');
var responder = require('../../../lib/responder');

describe('services', function () {
  
  var provider = dfs({
    root: '.tmp'
  });
  var app;
  
  beforeEach(function () {
    
    app = connect()
      .use(function (req, res, next) {
        
        responder({
          res: res,
          provider: provider
        });
        next();
      });
  });
  
  afterEach(function () {
    
    fs.removeSync('.tmp');
  });
  
  it('skips with no services given', function (done) {
    
    app.use(services());
    
    request(app)
      .get('/')
      .expect(404)
      .end(done);
  });
  
  it('runs based on url', function (done) {
    
    app.use(services({
      services: {
        forms: formsService({})
      },
      config: {
        forms: true
      }
    }));
    
    function formsService (spec) {
      
      return function (req, res, next) {
        
        res.end('forms');
        next();
      };
    }
    
    request(app)
      .get('/__/forms/test')
      .expect('forms')
      .end(done);
  });
  
  it('runs based on url disregarding case', function (done) {
    
    app.use(services({
      services: {
        forms: formsService({})
      },
      config: {
        Forms: true
      }
    }));
    
    function formsService (spec) {
      
      return function (req, res, next) {
        
        res.end('forms');
        next();
      };
    }
    
    request(app)
      .get('/__/forms/test')
      .expect('forms')
      .end(done);
  });
  
  it.skip('runs based on matches()', function (done) {
    
    app.use(services({
      services: {
        forms: formsService({})
      },
      config: {
        forms: true
      }
    }));
    
    function formsService (spec) {
      
      return function (req, res, next) {
        
        res.end('forms');
        next();
      };
    }
    
    formsService.matches = function (req) {
      
      return false;
    };
    
    request(app)
      .get('/__/forms-matches')
      .expect('forms')
      .end(done);
  });
});