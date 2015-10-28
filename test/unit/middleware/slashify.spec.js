/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var fs = require('fs-extra');
var expect = require('chai').expect;
var request = require('supertest');
var connect = require('connect');
var query = require('connect-query');

var slashify = require('../../../lib/middleware/slashify');
var dfs = require('../../../lib/dfs');
var responder = require('../../../lib/responder');

describe('trailing slashes', function () {
  
  var provider = dfs({
    root: '.tmp'
  });
  var app;
  
  beforeEach(function () {
    
    fs.outputFileSync('.tmp/index.html', 'index', 'utf8');
    fs.outputFileSync('.tmp/me.html', 'testing', 'utf8');
    fs.outputFileSync('.tmp/about/index.html', 'about index', 'utf8');
    
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
  
  it('removes the trailing slash for a given url', function (done) {
    
    app.use(slashify({
      provider: provider
    }));
    
    request(app)
      .get('/testing/')
      .expect(301)
      .expect('Location', '/testing')
      .end(done);
  });
  
  it('does not redirect the root url because of the trailing slash', function (done) {
    
    app.use(slashify({
      provider: provider
    }));
    
    request(app)
      .get('/')
      .expect(404)
      .end(done);
  });
  
  it('does not redirect for directory index files', function (done) {
    
    var app = connect()
    app.use(slashify({
      provider: provider
    }));
    
    request(app)
      .get('/about/')
      .expect(404)
      .expect(function (data) {
        expect(data.req.path).to.equal('/about/');
      })
      .end(done);
  });
  
  it('redirects directory index to have a trailing slash', function (done) {
    
    app.use(slashify({
      provider: provider
    }));
    
    request(app)
      .get('/about')
      .expect(function (req) {
        expect(req.headers.location).to.equal('/about/');
      })
      .expect(301)
      .end(done);
  });
  
  it('preserves the query parameters on redirect', function (done) {
    
    app.use(slashify({
      provider: provider
    }));
    
    request(app)
      .get('/contact/?query=param')
      .expect(301)
      .expect('Location', '/contact?query=param')
      .end(done);
  });
  
  it('preserves query parameters and slash on subdirectory directory index redirect', function (done) {
    
    app.use(slashify({
      provider: provider
    }));
    
    request(app)
      .get('/about?query=params')
      .expect(function (req) {
        expect(req.headers.location).to.equal('/about/?query=params');
      })
      .expect(301)
      .end(done);
  });
  
  describe('force trailing slash', function () {
    
    it('adds slash to url with no extension', function (done) {
      
      app.use(slashify({
        provider: provider,
        config: {
          trailing_slash: true
        }
      }));
      
      request(app)
        .get('/testing')
        .expect(301)
        .expect('Location', '/testing/')
        .end(done);
    });
    
    it('does not add slash to url with file extensions', function (done) {
      
      app
        .use(slashify({
          provider: provider,
          config: {
            trailing_slash: true
          }
        }))
        .use(function (req, res) {
          
          res.end('pass through');
        });
      
      request(app)
        .get('/me.html')
        .expect('pass through')
        .end(done);
    });
  });
  
  describe('force remove trailing slash', function () {
    
    it('removes trailing slash on urls with no file extension', function (done) {
      
      app.use(slashify({
        provider: provider,
        config: {
          trailing_slash: false
        }
      }));
      
      request(app)
        .get('/testing/')
        .expect(301)
        .expect('Location', '/testing')
        .end(done);
    });
  
    it('removes trailing slash on urls with file extension', function (done) {
      
      app.use(slashify({
        provider: provider,
        config: {
          trailing_slash: false
        }
      }));
      
      request(app)
        .get('/me.html/')
        .expect(301)
        .expect('Location', '/me.html')
        .end(done);
    });
    
    it('removes trailing slash on directory index urls', function (done) {
      
      app.use(slashify({
        provider: provider,
        config: {
          trailing_slash: false
        }
      }));
      
      request(app)
        .get('/about/')
        .expect(301)
        .expect('Location', '/about')
        .end(done);
    });
  });
  
});