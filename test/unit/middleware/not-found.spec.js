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
var join = require('join-path');
var expect = require('chai').expect;

var notFound = require('../../../lib/middleware/not-found');
var Responder = require('../../../lib/responder');

describe('not found', function() {
  var app;

  beforeEach(function() {
    fs.outputFileSync('.tmp/not-found.html', 'not found file', 'utf8');

    app = connect()
      .use(function(req, res, next) {
        res.superstatic = new Responder(req, res, {
          provider: {}
        });
        next();
      });
  });

  afterEach(function() {
    fs.removeSync('.tmp');
  });

  it('serves the file', function(done) {
    app
      .use(notFound({
        errorPage: '.tmp/not-found.html'
      }));

    request(app)
      .get('/anything')
      .expect(404)
      .expect('not found file')
      .end(done);
  });

  it('throws on file read error', function() {
    expect(function() {
      notFound({
        errorPage: '.tmp/does-not-exist.html'
      });
    }).to.throw('ENOENT');
  });

  it('caches for one hour', function(done) {
    app
    .use(notFound({
      errorPage: join(process.cwd(), '.tmp/not-found.html')
    }));

    request(app)
      .get('/anything')
      .expect(404)
      .expect('Cache-Control', 'public, max-age=3600')
      .end(done);
  });
});
