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

var notFound = require('../../../lib/middleware/not-found');
var responder = require('../../../lib/responder');

describe('not found', function () {

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

  it('serves the file', function (done) {

    app
      .use(notFound({
        file: join(process.cwd(), '.tmp/not-found.html')
      }));

    request(app)
      .get('/anything')
      .expect(404)
      .expect('not found file')
      .end(done);
  });

  it('exits middleware with 404 error on file read error', function (done) {

    app
      .use(notFound({

        file: join(process.cwd(), '.tmp/does-not-exist.html')
      }))
      .use(function (err, req, res, next) {

        res.__.status(err.status).__.send('error reading file');
      });

    request(app)
      .get('/anything')
      .expect(404)
      .expect('error reading file')
      .end(done);
  });

  it('caches for 6 months', function (done) {

    app
    .use(notFound({
      file: join(process.cwd(), '.tmp/not-found.html')
    }));

    request(app)
      .get('/anything')
      .expect(404)
      .expect('Cache-Control', 'public, max-age=' + (60 * 60 * 24 * 30 * 6))
      .end(done);
  });
});
