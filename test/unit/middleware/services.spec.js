/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var fs = require('fs-extra');
var request = require('supertest');
var connect = require('connect');
var expect = require('chai').expect;

var services = require('../../../lib/middleware/services');

describe('services', function () {
  
  var app;
  
  beforeEach(function () {
    
    app = connect();
  });
  
  it('skips with no services given', function (done) {
    
    app.use(services());
    
    request(app)
      .get('/')
      .expect(404)
      .end(done);
  });
  
  it('skips if no service in config', function (done) {
    
    app.use(services({
      services: {
        forms: formsService()
      },
      config: {}
    }));
    
    function formsService (spec) {
      
      return function (req, res, next) {
        
        res.end('forms');
        next();
      };
    }
    
    request(app)
      .get('/__/forms/test')
      .expect(404)
      .end(done);
  });
  
  it('runs based on url', function (done) {
    
    app.use(services({
      services: {
        forms: formsService()
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
        forms: formsService()
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
  
  it('runs based on matches()', function (done) {
    
    app.use(services({
      services: {
        forms: formsService()
      },
      config: {
        forms: true
      }
    }));
    
    function formsService (spec) {
      
      var fn = function (req, res, next) {
        
        res.end('forms');
        next();
      };
      
      fn.matches = function (req) {
        
        return true;
      };
      
      return fn;
    }
    
    request(app)
      .get('/__/forms-matches')
      .expect('forms')
      .end(done);
  });
  
  it('gives service config to service', function (done) {
    
    app.use(services({
      services: {
        forms: formsService()
      },
      config: {
        forms: true
      }
    }));
    
    function formsService (spec) {
      
      return function (req, res, next) {
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(req.service));
      };
    }
    
    request(app)
      .get('/__/forms/api/testing')
      .expect({
        name: 'forms',
        config: true,
        path: '/forms/api/testing'
      })
      .end(done);
  });
  
  it('removes service config foot print', function (done) {
    
    app.use(services({
      services: {
        forms: formsService()
      },
      config: {
        forms: true
      }
    }));
    
    app.use(function (req, res, next) {
      
      expect(req.service).to.equal(undefined);
      next();
    });
    
    function formsService (spec) {
      
      return function (req, res, next) {
        
        next();
      };
    }
    
    request(app)
      .get('/__/forms')
      .expect(404)
      .end(done);
  });
});