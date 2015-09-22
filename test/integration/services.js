/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var fs = require('fs-extra');
var _ = require('lodash');
var join = require('join-path');
var connect = require('connect');
var request = require('supertest');
var expect = require('chai').expect;
var query = require('connect-query');

var superstatic = require('../../');

var options = function () {
  return {
    config: {
      
    }
  };
};

describe('services', function () {
  
  it('GET', function (done) {
    
    var app = connect()
      .use(superstatic({
        config: {
          service1: true
        },
        services: {
          service1: function (req, res, next) {
              
            res.end('GET');
          }
        }
      }));
    
    request(app)
      .get('/__/service1')
      .expect(200)
      .expect('GET')
      .end(done);
  });
  
  it('POST', function (done) {
    
    var app = connect()
      .use(superstatic({
        config: {
          service1: true
        },
        services: {
          service1: function (req, res, next) {
              
            res.end('POST');
          }
        }
      }));
    
    request(app)
      .post('/__/service1')
      .expect(200)
      .expect('POST')
      .end(done);
  });
  
  it('matches', function (done) {
    
    var service1 = function (req, res, next) {
      
      res.end('service1');
    };
    
    service1.matches = function (req) {
      
      return true;
    };
    
    var app = connect()
      .use(superstatic({
        config: {
          service1: true
        },
        services: {
          service1: service1 
        }
      }));
    
    request(app)
      .get('/__/service-anything')
      .expect(200)
      .expect('service1')
      .end(done);
  });
});