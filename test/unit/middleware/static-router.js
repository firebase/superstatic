/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var fs = require('fs-extra');
var request = require('supertest');
var connect = require('connect');
var query = require('connect-query');

var staticRouter = require('../../../lib/middleware/static-router');
var dfs = require('../../../lib/dfs');
var responder = require('../../../lib/responder');

describe('static router', function () {

  var provider = dfs({
    root: '.tmp'
  });
  var app;

  beforeEach(function () {

    fs.outputFileSync('.tmp/index.html', 'index', 'utf8');

    app = connect()
      .use(function (req, res, next) {

        responder({
          req: req,
          res: res,
          provider: provider
        });
        next();
      })
  });

  afterEach(function () {

    fs.removeSync('.tmp');
  });

  it('serves a route', function (done) {

    app.use(staticRouter({
      rewrites: {
        '/my-route': '/index.html'
      }
    }));

    request(app)
      .get('/my-route')
      .expect(200)
      .expect('index')
      .expect('content-type', 'text/html; charset=utf-8')
      .end(done);
  });

  it('serves a route with a glob', function (done) {

    app.use(staticRouter({
      rewrites: {
        '**': '/index.html'
      }
    }));

    request(app)
      .get('/my-route')
      .expect(200)
      .expect('index')
      .expect('content-type', 'text/html; charset=utf-8')
      .end(done);
  });

  it('serves a negated route', function (done) {

    app.use(staticRouter({
      rewrites: {
        '!/no': '/index.html'
      }
    }));

    request(app)
      .get('/my-route')
      .expect(200)
      .expect('index')
      .expect('content-type', 'text/html; charset=utf-8')
      .end(done);
  });

  it('skips if no match is found', function (done) {

    app.use(staticRouter({
      rewrites: {
        '/skip': '/index.html'
      }
    }));

    request(app)
      .get('/hi')
      .expect(404)
      .end(done);
  });

  it('ensures matching file extension', function (done) {

    app.use(staticRouter({
      rewrites: {
        '**': "/index.html"
      }
    }));

    request(app)
      .get('/index.js')
      .expect(404)
      .end(done);
  });

  describe('uses first match', function () {

    beforeEach(function () {

      fs.outputFileSync('.tmp/admin/index.html', 'admin index', 'utf8');

      app.use(staticRouter({
        rewrites: [
          {
            "/admin/**": "/admin/index.html",
            "/something/**": "/something/indexf.html"
          },
          {"**": "index.html"}
        ]
      }));
    });

    it('first route with 1 depth route', function (done) {

      request(app)
        .get('/admin/anything')
        .expect(200)
        .expect('admin index')
        .end(done);
    });

    it('first route with 2 depth route', function (done) {

      request(app)
        .get('/admin/anything/else')
        .expect(200)
        .expect('admin index')
        .end(done);
    });

    it('second route', function (done) {

      request(app)
        .get('/anything')
        .expect(200)
        .expect('index')
        .end(done);
    });
  });
});
