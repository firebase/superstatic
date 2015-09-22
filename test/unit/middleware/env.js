/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var request = require('supertest');
var connect = require('connect');
var query = require('connect-query');
var Router = require('router');

var env = require('../../../lib/middleware/env');
var responder = require('../../../lib/responder');

describe('env', function () {

  var app;
  var router;

  beforeEach(function () {
    app = connect()
      .use(function (req, res, next) {

        responder({
          req: req,
          res: res,
          provider: {}
        });
        next();
      });
  });

  it('serves json', function (done) {
    app.use(env({
      data: {
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

  it('serves javascript', function (done) {
    app.use(env({
      data: {
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
