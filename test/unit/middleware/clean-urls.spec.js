/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var fs = require('fs-extra');
var request = require('supertest');
var connect = require('connect');
var query = require('connect-query');

var helpers = require('../../helpers');
var cleanUrls = helpers.decorator(require('../../../lib/middleware/clean-urls'));
var fsProvider = require('../../../lib/providers/fs');
var Responder = require('../../../lib/responder');

describe('clean urls', function() {
  var provider = fsProvider({
    public: '.tmp'
  });
  var app;

  beforeEach(function() {
    app = connect()
      .use(function(req, res, next) {
        res.superstatic = new Responder(req, res, {
          provider: provider
        });
        next();
      })
      .use(query());
  });

  afterEach(function() {
    fs.removeSync('.tmp');
  });

  it('function() to the clean url path when static html file is requested', function(done) {
    app.use(cleanUrls({
      cleanUrls: true
    }));

    request(app)
      .get('/superstatic.html')
      .expect('Location', '/superstatic')
      .expect(301)
      .end(done);
  });

  it('it function() and keeps the query string', function(done) {
    app.use(cleanUrls({
      cleanUrls: true
    }));

    request(app)
      .get('/superstatic.html?key=value')
      .expect('Location', '/superstatic?key=value')
      .expect(301)
      .end(done);
  });

  it('serves the .html version of the clean url if cleanUrls are on', function(done) {
    fs.outputFileSync('.tmp/superstatic.html', 'test', 'utf8');

    app.use(cleanUrls({
      cleanUrls: true
    }));

    request(app)
      .get('/superstatic')
      .expect(200)
      .expect('test')
      .expect('content-type', 'text/html; charset=utf-8')
      .end(done);
  });

  it('skips middleware on stream error', function(done) {
    app.use(cleanUrls({
      cleanUrls: true
    }));

    request(app)
      .get('/superstatic')
      .expect(404)
      .end(done);
  });

  it('accepts a string value of "true" as a value to turn on for all paths', function(done) {
    fs.outputFileSync('.tmp/yes/superstatic.html', 'test', 'utf8');

    app.use(cleanUrls({
      cleanUrls: 'true'
    }));

    request(app)
      .get('/yes/superstatic')
      .expect(200)
      .expect('test')
      .end(done);
  });

  it('skips the middleware if it is the root path', function(done) {
    app.use(cleanUrls({}));

    request(app)
      .get('/')
      .expect(404)
      .end(done);
  });

  describe('glob patterns', function() {
    it('function() to clean url', function(done) {
      fs.outputFileSync('.tmp/yes/superstatic.html', 'test', 'utf8');

      app.use(cleanUrls({
        cleanUrls: '**/*.html'
      }));

      request(app)
        .get('/superstatic.html')
        .expect(301)
        .expect('Location', '/superstatic')
        .end(done);
    });

    it('serves clean url', function(done) {
      fs.outputFileSync('.tmp/superstatic.html', 'test', 'utf8');

      app.use(cleanUrls({
        cleanUrls: '/superstatic.html'
      }));

      request(app)
        .get('/superstatic')
        .expect(200)
        .end(done);
    });

    it('function() with an array of globs', function(done) {
      fs.outputFileSync('.tmp/yes/superstatic.html', 'test', 'utf8');

      app.use(cleanUrls({
        cleanUrls: ['**/*.html', 'yes/**/*.html']
      }));

      request(app)
        .get('/yes/superstatic.html')
        .expect(301)
        .expect('Location', '/yes/superstatic')
        .end(done);
    });

    describe('combined globs with negation', function() {
      it('cleans all in a givent directory', function(done) {
        fs.outputFileSync('.tmp/app/test.html', 'test', 'utf8');
        fs.outputFileSync('.tmp/components/test.html', 'test', 'utf8');

        app.use(cleanUrls({
          cleanUrls: ['/app**', '!/components**']
        }));

        request(app)
          .get('/app/test.html')
          .expect(301)
          .expect('Location', '/app/test')
          .end(done);
      });

      it('ignores all in a given directory', function(done) {
        fs.outputFileSync('.tmp/app/test.html', 'test', 'utf8');
        fs.outputFileSync('.tmp/components/test.html', 'test', 'utf8');

        app
          .use(cleanUrls({
            cleanUrls: ['/app**', '/!(components|bower_components)/**']
          }))
          .use(function(req, res) {
            res.end('fall through');
          });

        request(app)
          .get('/components/test.html')
          .expect(200)
          .expect('fall through')
          .end(done);
      });
    });

    it('serves the clean url from an array of globs', function(done) {
      fs.outputFileSync('.tmp/yes/superstatic.html', 'test', 'utf8');

      app.use(cleanUrls({
        cleanUrls: ['**/*.html', 'yes/**/*.html']
      }));

      request(app)
        .get('/yes/superstatic')
        .expect(200)
        .end(done);
    });

    it('function() with an arguments-like object of globs', function(done) {
      fs.outputFileSync('.tmp/yes/superstatic.html', 'test', 'utf8');

      app.use(cleanUrls({
        cleanUrls: {'0': '**/*.html', '2': 'yes/**/*.html'}
      }));

      request(app)
        .get('/yes/superstatic.html')
        .expect(301)
        .end(done);
    });
  });

  describe('directory index', function() {
    beforeEach(function() {
      fs.outputFileSync('.tmp/dir/index.html', 'index', 'utf8');
    });

    it('function() on directory index with extension', function(done) {
      app.use(cleanUrls({
        cleanUrls: true
      }));

      request(app)
        .get('/dir/index.html')
        .expect('Location', '/dir')
        .expect(301)
        .end(done);
    });

    it('function() on directory index without extension', function(done) {
      app.use(cleanUrls({
        cleanUrls: true
      }));

      request(app)
        .get('/dir/index')
        .expect('Location', '/dir')
        .expect(301)
        .end(done);
    });

    it('serves directory index from clean url', function(done) {
      app.use(cleanUrls({
        cleanUrls: true
      }));

      request(app)
        .get('/dir')
        .expect(200)
        .expect('index')
        .expect('content-type', 'text/html; charset=utf-8')
        .end(done);
    });
  });
});
