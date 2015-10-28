/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var fs = require('fs-extra');
var request = require('supertest');
var connect = require('connect');

var static = require('../../../lib/middleware/static');
var dfs = require('../../../lib/dfs');
var responder = require('../../../lib/responder');

describe('static files', function () {
  
  var provider = dfs({
    root: '.tmp'
  });
  var app;
  
  beforeEach(function () {
    
    app = connect()
      .use(function (req, res, next) {
        
        responder({
          req: req,
          res: res,
          provider: provider
        });
        next();
      });
  });
  
  afterEach(function () {
    
    fs.removeSync('.tmp');
  });
  
  it('serves html file', function (done) {
    
    fs.outputFileSync('.tmp/superstatic.html', 'test', 'utf8');
    
    app.use(static());
    
    request(app)
      .get('/superstatic.html')
      .expect(200)
      .expect('test')
      .expect('content-type', 'text/html; charset=utf-8')
      .end(done);
  });
  
  it('serves css file', function (done) {
    
    fs.outputFileSync('.tmp/style.css', 'body {}', 'utf8');
    
    app.use(static());
    
    request(app)
      .get('/style.css')
      .expect(200)
      .expect('body {}')
      .expect('content-type', 'text/css; charset=utf-8')
      .end(done);
  });
  
  it('serves a directory index file', function (done) {
    
    fs.outputFileSync('.tmp/index.html', 'test', 'utf8');
    
    app.use(static());
    
    request(app)
      .get('/')
      .expect(200)
      .expect('test')
      .expect('content-type', 'text/html; charset=utf-8')
      .end(done);
  });
  
  it('serves a file with query parameters', function (done) {
    
    fs.outputFileSync('.tmp/superstatic.html', 'test', 'utf8');
    
    app.use(static());
    
    request(app)
      .get('/superstatic.html?key=value')
      .expect(200)
      .expect('test')
      .end(done);
  });
});