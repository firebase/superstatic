/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var request = require('supertest');
var connect = require('connect');

var helpers = require('../../helpers');
var env = helpers.decorator(require('../../../lib/middleware/env'));
var Responder = require('../../../lib/responder');

describe('env', function() {
  var app;

  beforeEach(function() {
    app = connect()
      .use(function(req, res, next) {
        res.superstatic = new Responder(req, res, {
          provider: {}
        });
        next();
      });
  });

  it('serves json', function(done) {
    app.use(env({
      env: {
        key: 'value'
      }
    }));

    request(app)
      .get('/__/env.json')
      .expect(200)
      .expect({
        key: 'value'
      })
      .expect('content-type', 'application/json; charset=utf-8')
      .end(done);
  });

  it('serves javascript', function(done) {
    app.use(env({
      env: {
        key: 'value'
      }
    }));

    request(app)
      .get('/__/env.js')
      .expect(200)
      .expect('content-type', 'application/javascript; charset=utf-8')
      .end(done);
  });
});
