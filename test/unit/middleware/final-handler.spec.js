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
var join = require('join-path');

var finalHandler = require('../../../lib/middleware/final-handler');
var dfs = require('../../../lib/dfs');
var responder = require('../../../lib/responder');

describe('final handler', function () {

  var app;

  beforeEach(function () {

    fs.outputFileSync('.tmp/not-found.html', 'not found file', 'utf8');

    app = connect()
      .use(function (req, res, next) {

        responder({
          req: req,
          res: res,
          provider: {}
        });
        next();
      })
  });

  afterEach(function () {

    fs.removeSync('.tmp');
  });

  it('serves the default error page', function (done) {

    app
      .use(function (req, res, next) {

        next({status: 404});
      })
      .use(finalHandler({
        file: join(process.cwd(), '.tmp/not-found.html')
      }));

    request(app)
      .get('/anything')
      .expect(404)
      .expect('not found file')
      .end(done);
  });

  it('serves last ditch effort error page if there is one more error', function (done) {

    app
      .use(function (req, res, next) {

        next({status: 404});
      })
      .use(finalHandler({
        file: join(process.cwd(), '.tmp/does-not-exist.html')
      }));

    request(app)
      .get('/anything')
      .expect(404)
      .expect('Not Found')
      .end(done);
  });

  it('sets a custom status from error', function (done) {

    app
      .use(function (req, res, next) {

        next({status: 400});
      })
      .use(finalHandler({
        file: join(process.cwd(), '.tmp/not-found.html')
      }));

    request(app)
      .get('/anything')
      .expect(400)
      .expect('not found file')
      .end(done);
  });

  it('caches for 6 months', function (done) {

    app
      .use(function (req, res, next) {

        next({status: 404});
      })
      .use(finalHandler({
        file: join(process.cwd(), '.tmp/not-found.html')
      }));

    request(app)
      .get('/anything')
      .expect(404)
      .expect('Cache-Control', 'public, max-age=' + (60 * 60 * 24 * 30 * 6))
      .end(done);
  });
});
