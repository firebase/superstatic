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
    fs.outputFileSync('.tmp/foo.html', 'foo.html content', 'utf8');
    fs.outputFileSync('.tmp/foo/index.html', 'foo/index.html content', 'utf8');
    fs.outputFileSync('.tmp/foo/bar.html', 'foo/bar.html content', 'utf8');

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
    app.use(files({}, {provider: provider}));

    request(app)
      .get('/foo.html')
      .expect(200)
      .expect('foo.html content')
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
    fs.outputFileSync('.tmp/index.html', 'an actual index', 'utf8');

    app.use(files({}, {provider: provider}));

    request(app)
      .get('/')
      .expect(200)
      .expect('an actual index')
      .end(done);
  });

  it('does not redirect for directory index files', function(done) {
    app.use(files({}, {provider: provider}));

    request(app)
      .get('/foo/')
      .expect(200)
      .expect(function(data) {
        expect(data.req.path).to.equal('/foo/');
      })
      .end(done);
  });

  it('function() directory index to have a trailing slash', function(done) {
    app.use(files({}, {provider: provider}));

    request(app)
      .get('/foo')
      .expect(function(req) {
        expect(req.headers.location).to.equal('/foo/');
      })
      .expect(301)
      .end(done);
  });

  it('preserves query parameters and slash on subdirectory directory index redirect', function(done) {
    app.use(files({}, {provider: provider}));

    request(app)
      .get('/foo?query=params')
      .expect(function(req) {
        expect(req.headers.location).to.equal('/foo/?query=params');
      })
      .expect(301)
      .end(done);
  });

  describe('force trailing slash', function() {
    it('adds slash to url with no extension', function(done) {
      app.use(files({trailingSlash: true}, {provider: provider}));

      request(app)
        .get('/foo')
        .expect(301)
        .expect('Location', '/foo/')
        .end(done);
    });
  });

  describe('force remove trailing slash', function() {
    it('removes trailing slash on urls with no file extension', function(done) {
      app.use(files({trailingSlash: false}, {provider: provider}));

      request(app)
        .get('/foo/')
        .expect(301)
        .expect('Location', '/foo')
        .end(done);
    });

    it('returns a 404 if a trailing slash was added to a valid path', function(done) {
      app.use(files({trailingSlash: false}, {provider: provider}));

      request(app)
        .get('/foo.html/')
        .expect(404)
        .end(done);
    });

    it('removes trailing slash on directory index urls', function(done) {
      app.use(files({trailingSlash: false}, {provider: provider}));

      request(app)
        .get('/foo/')
        .expect(301)
        .expect('Location', '/foo')
        .end(done);
    });

    it('normalizes multiple leading slashes on a redirect', function(done) {
      app.use(files({trailingSlash: false}, {provider: provider}));

      request(app)
        .get('/foo////')
        .expect(301)
        .expect('Location', '/foo')
        .end(done);
    });
  });

  [
    {
      trailingSlashBehavior: undefined,
      cleanUrls: false,
      tests: [
        {path: '/foo', wantRedirect: '/foo/'},
        {path: '/foo.html', wantContent: 'foo.html content'},
        {path: '/foo.html/', wantNotFound: true},
        {path: '/foo/', wantContent: 'foo/index.html content'},
        {path: '/foo/bar', wantNotFound: true},
        {path: '/foo/bar.html', wantContent: 'foo/bar.html content'},
        {path: '/foo/bar.html/', wantNotFound: true},
        {path: '/foo/bar/', wantNotFound: true},
        {path: '/foo/index', wantNotFound: true},
        {path: '/foo/index.html', wantContent: 'foo/index.html content'},
        {path: '/foo/index.html/', wantNotFound: true}
      ]
    },
    {
      trailingSlashBehavior: false,
      cleanUrls: false,
      tests: [
        {path: '/foo', wantContent: 'foo/index.html content'},
        {path: '/foo.html', wantContent: 'foo.html content'},
        {path: '/foo.html/', wantNotFound: true},
        {path: '/foo/', wantRedirect: '/foo'},
        {path: '/foo/bar', wantNotFound: true},
        {path: '/foo/bar.html', wantContent: 'foo/bar.html content'},
        {path: '/foo/bar.html/', wantNotFound: true},
        {path: '/foo/bar/', wantNotFound: true},
        {path: '/foo/index', wantNotFound: true},
        {path: '/foo/index.html', wantContent: 'foo/index.html content'},
        {path: '/foo/index.html/', wantNotFound: true}
      ]
    },
    {
      trailingSlashBehavior: true,
      cleanUrls: false,
      tests: [
        {path: '/foo', wantRedirect: '/foo/'},
        {path: '/foo.html', wantContent: 'foo.html content'},
        {path: '/foo.html/', wantNotFound: true},
        {path: '/foo/', wantContent: 'foo/index.html content'},
        {path: '/foo/bar', wantNotFound: true},
        {path: '/foo/bar.html', wantContent: 'foo/bar.html content'},
        {path: '/foo/bar.html/', wantNotFound: true},
        {path: '/foo/bar/', wantNotFound: true},
        {path: '/foo/index', wantNotFound: true},
        {path: '/foo/index.html', wantContent: 'foo/index.html content'},
        {path: '/foo/index.html/', wantNotFound: true}
      ]
    },
    {
      trailingSlashBehavior: undefined,
      cleanUrls: true,
      tests: [
        {path: '/foo', wantContent: 'foo/index.html content'},
        {path: '/foo.html', wantRedirect: '/foo'},
        {path: '/foo.html/', wantNotFound: true},
        {path: '/foo/', wantContent: 'foo/index.html content'},
        {path: '/foo/bar', wantContent: 'foo/bar.html content'},
        {path: '/foo/bar.html', wantRedirect: '/foo/bar'},
        {path: '/foo/bar.html/', wantNotFound: true},
        {path: '/foo/bar/', wantNotFound: true},
        {path: '/foo/index', wantRedirect: '/foo'},
        {path: '/foo/index.html', wantRedirect: '/foo'},
        {path: '/foo/index.html/', wantNotFound: true}
      ]
    },
    {
      trailingSlashBehavior: false,
      cleanUrls: true,
      tests: [
        {path: '/foo', wantContent: 'foo/index.html content'},
        {path: '/foo.html', wantRedirect: '/foo'},
        {path: '/foo.html/', wantNotFound: true},
        {path: '/foo/', wantRedirect: '/foo'},
        {path: '/foo/bar', wantContent: 'foo/bar.html content'},
        {path: '/foo/bar.html', wantRedirect: '/foo/bar'},
        {path: '/foo/bar.html/', wantNotFound: true},
        {path: '/foo/bar/', wantRedirect: '/foo/bar'},
        {path: '/foo/index', wantRedirect: '/foo'},
        {path: '/foo/index.html', wantRedirect: '/foo'},
        {path: '/foo/index.html/', wantNotFound: true}
      ]
    },
    {
      trailingSlashBehavior: true,
      cleanUrls: true,
      tests: [
        {path: '/foo', wantRedirect: '/foo/'},
        {path: '/foo.html', wantRedirect: '/foo/'},
        {path: '/foo.html/', wantNotFound: true},
        {path: '/foo/', wantContent: 'foo/index.html content'},
        {path: '/foo/bar', wantRedirect: '/foo/bar/'},
        {path: '/foo/bar.html', wantRedirect: '/foo/bar/'},
        {path: '/foo/bar.html/', wantNotFound: true},
        {path: '/foo/bar/', wantContent: 'foo/bar.html content'},
        {path: '/foo/index', wantRedirect: '/foo/'},
        {path: '/foo/index.html', wantRedirect: '/foo/'},
        {path: '/foo/index.html/', wantNotFound: true}
      ]
    }
  ].forEach(function(t) {
    var desc = 'trailing slash ' + t.trailingSlashBehavior + ' cleanUrls ' + t.cleanUrls + ' ';
    t.tests.forEach(function(tt) {
      var ttDesc = desc + JSON.stringify(tt);
      it('should behave correctly: ' + ttDesc, function(done) {
        app.use(files({trailingSlash: t.trailingSlashBehavior, cleanUrls: t.cleanUrls}, {provider: provider}));

        var r = request(app).get(tt.path);
        if (tt.wantRedirect) {
          r.expect(301).expect('Location', tt.wantRedirect);
        } else if (tt.wantNotFound) {
          r.expect(404);
        } else if (tt.wantContent) {
          r.expect(200).expect(tt.wantContent);
        } else {
          done(new Error('Test set up incorrectly'));
        }
        r.end(done);
      });
    });
  });
});
