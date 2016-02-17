/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var fs = require('fs-extra');
var join = require('join-path');
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

describe('serves', function() {
  beforeEach(function() {
    fs.outputFileSync('.tmp/index.html', 'index', 'utf-8');
    fs.outputFileSync('.tmp/test.html', 'test', 'utf-8');
    fs.outputFileSync('.tmp/app.js', 'console.log("js")', 'utf-8');
    fs.outputFileSync('.tmp/dir/index.html', 'dir index', 'utf-8');
    fs.outputFileSync('.tmp/dir/sub.html', 'dir sub', 'utf-8');
  });

  afterEach(function() {
    fs.removeSync('.tmp');
  });

  it('static file', function(done) {
    var opts = options();

    var app = connect()
      .use(superstatic(opts));

    request(app)
      .get('/test.html')
      .expect(200)
      .expect('test')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .end(done);
  });

  it('directory index file', function(done) {
    var opts = options();

    var app = connect()
      .use(superstatic(opts));

    request(app)
      .get('/dir/')
      .expect(200)
      .expect('dir index')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .end(done);
  });

  it('cannot access files above the root', function(done) {
    var app = connect()
      .use(superstatic(options()));

    request(app)
      .get('/../README.md')
      .expect(404)
      .end(done);
  });

  it('missing directory index', function(done) {
    var opts = options();

    opts.config.public = './';

    var app = connect()
      .use(superstatic(opts));

    request(app)
      .get('/')
      .expect(404)
      .end(done);
  });

  it('javascript file', function(done) {
    var opts = options();

    var app = connect()
      .use(superstatic(opts));

    request(app)
      .get('/app.js')
      .expect(200)
      .expect('console.log("js")')
      .expect('Content-Type', 'application/javascript; charset=utf-8')
      .end(done);
  });

  it('from custom current working directory', function(done) {
    var opts = options();

    opts.cwd = join(process.cwd(), '.tmp');
    opts.config.public = './dir';

    var app = connect()
      .use(superstatic(opts));

    request(app)
      .get('/index.html')
      .expect(200)
      .expect('dir index')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .end(done);
  });

  describe('redirects', function() {
    var opts = options();

    opts.config.redirects = [
      {source: '/from', destination: '/to'},
      {source: '/fromCustom', destination: '/toCustom', type: 302},
      {source: '/external', destination: 'http://redirect.com'}
    ];

    var app = connect()
      .use(superstatic(opts));

    it('301', function(done) {
      request(app)
        .get('/from')
        .expect(301)
        .expect('Location', '/to')
        .end(done);
    });

    it('custom', function(done) {
      request(app)
        .get('/fromCustom')
        .expect(302)
        .expect('Location', '/toCustom')
        .end(done);
    });

    it('external urls', function(done) {
      request(app)
        .get('/external')
        .expect(301)
        .expect('Location', 'http://redirect.com')
        .end(done);
    });
  });

  describe('trailing slash', function() {
    xit('removes trailling slash for file', function(done) {
      var app = connect()
        .use(superstatic(options()));

      request(app)
        .get('/test.html/')
        .expect(301)
        .expect('Location', '/test.html')
        .end(done);
    });

    it('add trailing slash with a directory index file', function(done) {
      var app = connect()
        .use(superstatic(options()));

      request(app)
        .get('/dir')
        .expect(301)
        .expect('Location', '/dir/')
        .end(done);
    });
  });

  describe('basic auth', function() {
    it('protects', function(done) {
      var opts = options();

      opts.protect = 'username:passwords';

      var app = connect()
        .use(superstatic(opts));

      request(app)
        .get('/')
        .expect(401)
        .expect('www-authenticate', 'Basic realm="Authorization Required"')
        .end(done);
    });
  });

  describe('custom headers', function() {
    it('with globs', function(done) {
      var opts = options();

      opts.config.headers = [
        {source: '/**/*.html', headers: [{
          key: 'x-custom',
          value: 'testing'
        }]}
      ];

      var app = connect()
        .use(superstatic(opts));

      request(app)
        .get('/dir/sub.html')
        .expect('x-custom', 'testing')
        .end(done);
    });

    it('exact', function(done) {
      var opts = options();

      opts.config.headers = [{
        source: '/app.js', headers: [{
          key: 'x-custom', value: 'testing'
        }]
      }];

      var app = connect()
        .use(superstatic(opts));

      request(app)
        .get('/app.js')
        .expect('x-custom', 'testing')
        .end(done);
    });
  });

  xdescribe('environment variables', function() {
    it('json', function(done) {
      var opts = options();

      opts.env = {
        key: 'value'
      };

      var app = connect()
        .use(superstatic(opts));

      request(app)
        .get('/__/env.json')
        .expect({key: 'value'})
        .expect('Content-Type', 'application/json; charset=utf-8')
        .end(done);
    });

    it('js', function(done) {
      var opts = options();

      opts.env = {
        key: 'value'
      };

      var app = connect()
        .use(superstatic(opts));

      request(app)
        .get('/__/env.js')
        .expect(200)
        .expect('Content-Type', 'application/javascript; charset=utf-8')
        .end(done);
    });

    it('defaults to .env.json', function(done) {
      fs.outputFileSync('.env.json', '{"key":"value"}');

      var app = connect()
        .use(superstatic());

      request(app)
        .get('/__/env.json')
        .expect({key: 'value'})
        .end(function(err) {
          fs.remove('.env.json');
          done(err);
        });
    });

    it('serves env file, overriding static routing', function(done) {
      var opts = options();

      opts.env = {
        key: 'value'
      };

      opts.config.rewrites = [{
        source: '**',
        destination: '/index.html'
      }];

      var app = connect()
        .use(superstatic(opts));

      request(app)
        .get('/__/env.json')
        .expect({key: 'value'})
        .expect('Content-Type', 'application/json; charset=utf-8')
        .end(done);
    });
  });

  describe('custom routes', function() {
    it('serves file', function(done) {
      var opts = options();

      opts.config.rewrites = [{
        source: '/testing',
        destination: '/index.html'
      }];

      var app = connect()
        .use(superstatic(opts));

      request(app)
        .get('/testing')
        .expect(200)
        .expect('index')
        .expect('Content-Type', 'text/html; charset=utf-8')
        .end(done);
    });

    it('serves file from custom route when clean urls are on and route matches an html as a clean url', function(done) {
      var opts = options();

      opts.config.cleanUrls = true;
      opts.config.rewrites = [{
        source: '/testing',
        destination: '/index.html'
      }];

      var app = connect()
        .use(superstatic(opts));

      request(app)
        .get('/testing')
        .expect(200)
        .expect('index')
        .expect('Content-Type', 'text/html; charset=utf-8')
        .end(done);
    });

    it('serves static file when no matching route', function(done) {
      var opts = options();

      opts.config.rewrites = [{
        source: '/testing',
        destination: '/index.html'
      }];

      var app = connect()
        .use(superstatic(opts));

      request(app)
        .get('/test.html')
        .expect(200)
        .expect('test')
        .end(done);
    });

    it('serves with negation', function(done) {
      var opts = options();

      opts.config.rewrites = [{
        source: '!/no',
        destination: '/index.html'
      }];

      var app = connect()
        .use(superstatic(opts));

      request(app)
        .get('/no')
        .expect(404)
        .end(done);
    });

    it('serves file if url matches exact file path', function(done) {
      var opts = options();

      opts.config.rewrites = [{
        source: '**',
        destination: '/index.html'
      }];

      var app = connect()
        .use(superstatic(opts));

      request(app)
        .get('/test.html')
        .expect(200)
        .expect('test')
        .end(done);
    });
  });
});
