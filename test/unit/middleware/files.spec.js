/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var fs = require('fs-extra');
var expect = require('chai').expect;
var request = require('supertest');
var connect = require('connect');

var helpers = require('../../helpers');
var files = helpers.decorator(require('../../../lib/middleware/files'));
var fsProvider = require('../../../lib/providers/fs');
var Responder = require('../../../lib/responder');

describe('static server with trailing slash customization', function() {
  var provider = fsProvider({
    public: '.tmp'
  });
  var app;

  beforeEach(function() {
    fs.outputFileSync('.tmp/index.html', 'index', 'utf8');
    fs.outputFileSync('.tmp/me.html', 'testing', 'utf8');
    fs.outputFileSync('.tmp/about/index.html', 'about index', 'utf8');

    app = connect()
      .use(function(req, res, next) {
        res.superstatic = new Responder(req, res, {
          provider: provider
        });
        next();
      });
  });

  afterEach(function() {
    fs.removeSync('.tmp');
  });

  it('serves html file', function(done) {
    fs.outputFileSync('.tmp/superstatic.html', 'test', 'utf8');

    app.use(files({}, {provider: provider}));

    request(app)
      .get('/superstatic.html')
      .expect(200)
      .expect('test')
      .expect('content-type', 'text/html; charset=utf-8')
      .end(done);
  });

  it('serves html file with unicode name', function(done) {
    fs.outputFileSync('.tmp/äää.html', 'test', 'utf8');

    app.use(files({}, {provider: provider}));

    request(app)
      .get('/äää.html')
      .expect(200)
      .expect('test')
      .expect('content-type', 'text/html; charset=utf-8')
      .end(done);
  });

  it('serves css file', function(done) {
    fs.outputFileSync('.tmp/style.css', 'body {}', 'utf8');

    app.use(files({}, {provider: provider}));

    request(app)
      .get('/style.css')
      .expect(200)
      .expect('body {}')
      .expect('content-type', 'text/css; charset=utf-8')
      .end(done);
  });

  it('serves a directory index file', function(done) {
    fs.outputFileSync('.tmp/index.html', 'test', 'utf8');

    app.use(files({}, {provider: provider}));

    request(app)
      .get('/')
      .expect(200)
      .expect('test')
      .expect('content-type', 'text/html; charset=utf-8')
      .end(done);
  });

  it('serves a file with query parameters', function(done) {
    fs.outputFileSync('.tmp/superstatic.html', 'test', 'utf8');

    app.use(files({}, {provider: provider}));

    request(app)
      .get('/superstatic.html?key=value')
      .expect(200)
      .expect('test')
      .end(done);
  });

  it('does not redirect the root url because of the trailing slash', function(done) {
    app.use(files({}, {provider: provider}));

    request(app)
      .get('/')
      .expect(200)
      .end(done);
  });

  it('does not redirect for directory index files', function(done) {
    app.use(files({}, {provider: provider}));

    request(app)
      .get('/about/')
      .expect(200)
      .expect(function(data) {
        expect(data.req.path).to.equal('/about/');
      })
      .end(done);
  });

  it('function() directory index to have a trailing slash', function(done) {
    app.use(files({}, {provider: provider}));

    request(app)
      .get('/about')
      .expect(function(req) {
        expect(req.headers.location).to.equal('/about/');
      })
      .expect(301)
      .end(done);
  });

  it('preserves query parameters and slash on subdirectory directory index redirect', function(done) {
    app.use(files({}, {provider: provider}));

    request(app)
      .get('/about?query=params')
      .expect(function(req) {
        expect(req.headers.location).to.equal('/about/?query=params');
      })
      .expect(301)
      .end(done);
  });

  describe('force trailing slash', function() {
    it('adds slash to url with no extension', function(done) {
      app.use(files({trailingSlash: true}, {provider: provider}));

      request(app)
        .get('/testing')
        .expect(301)
        .expect('Location', '/testing/')
        .end(done);
    });
  });

  describe('force remove trailing slash', function() {
    it('removes trailing slash on urls with no file extension', function(done) {
      app.use(files({trailingSlash: false}, {provider: provider}));

      request(app)
        .get('/testing/')
        .expect(301)
        .expect('Location', '/testing')
        .end(done);
    });

    it('removes trailing slash on urls with file extension', function(done) {
      app.use(files({trailingSlash: false}, {provider: provider}));

      request(app)
        .get('/me.html/')
        .expect(301)
        .expect('Location', '/me.html')
        .end(done);
    });

    it('removes trailing slash on directory index urls', function(done) {
      app.use(files({trailingSlash: false}, {provider: provider}));

      request(app)
        .get('/about/')
        .expect(301)
        .expect('Location', '/about')
        .end(done);
    });

    it('normalizes multiple leading slashes on a redirect', function(done) {
      app.use(files({trailingSlash: false}, {provider: provider}));

      request(app)
        .get('//firebase.google.com/')
        .expect(301)
        .expect('Location', '/firebase.google.com')
        .end(done);
    });
  });
});
