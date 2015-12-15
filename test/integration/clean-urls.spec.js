/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var fs = require('fs-extra');
var connect = require('connect');
var request = require('supertest');

var superstatic = require('../../');

var options = function() {
  return {
    config: {
      public: '.tmp'
    }
  };
};

describe('clean urls', function() {
  beforeEach(function() {
    fs.outputFileSync('.tmp/index.html', 'index', 'utf8');
    fs.outputFileSync('.tmp/test.html', 'test', 'utf8');
    fs.outputFileSync('.tmp/app.js', 'console.log("js")', 'utf8');
    fs.outputFileSync('.tmp/dir/index.html', 'dir index', 'utf8');
    fs.outputFileSync('.tmp/dir/sub.html', 'dir sub', 'utf8');
  });

  afterEach(function() {
    fs.removeSync('.tmp');
  });

  it('not configured', function(done) {
    var opts = options();

    var app = connect()
      .use(superstatic(opts));

    request(app)
      .get('/test')
      .expect(404)
      .end(done);
  });

  it('redirects html file', function(done) {
    var opts = options();

    opts.config.cleanUrls = true;

    var app = connect()
      .use(superstatic(opts));

    request(app)
      .get('/test.html')
      .expect(301)
      .expect('Location', '/test')
      .end(done);
  });

  it('serves html file', function(done) {
    var opts = options();

    opts.config.cleanUrls = true;

    var app = connect()
      .use(superstatic(opts));

    request(app)
      .get('/test')
      .expect(200)
      .expect('test')
      .end(done);
  });

  it('redirects using globs', function(done) {
    var opts = options();

    opts.config.cleanUrls = ['/*.html'];

    var app = connect()
      .use(superstatic(opts));

    request(app)
      .get('/test.html')
      .expect(301)
      .expect('Location', '/test')
      .end(done);
  });

  it('serves html file using globs', function(done) {
    var opts = options();

    opts.config.cleanUrls = ['*.html'];

    var app = connect()
      .use(superstatic(opts));

    request(app)
      .get('/test')
      .expect(200)
      .expect('test')
      .end(done);
  });
});
