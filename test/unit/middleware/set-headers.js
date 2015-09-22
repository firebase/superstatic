/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var headers = require('../../../lib/middleware/set-headers');
var connect = require('connect');
var request = require('supertest');

var defaultHeaders = {
  '/test1': {
    'Content-Type': 'mime/type'
  },
  '/test3': {
    'Access-Control-Allow-Origin': 'https://www.example.net'
  },
  '/api/**': {
    'Access-Control-Allow-Origin': '*'
  }
};

describe('cors middleware', function() {

  it('serves custom content types', function (done) {

    var app = connect()
      .use(headers(defaultHeaders))
      .use(okay);

    request(app)
      .get('/test1')
      .expect(200)
      .expect('Content-Type', 'mime/type')
      .end(done);
  });

  it('serves custom access control headers', function (done) {

    var app = connect()
      .use(headers(defaultHeaders))
      .use(okay);

    request(app)
      .get('/test3')
      .expect(200)
      .expect('Access-Control-Allow-Origin', 'https://www.example.net')
      .end(done);
  });

  it('uses routing rules', function (done) {

    var app = connect()
      .use(headers(defaultHeaders))
      .use(okay);

    request(app)
      .get('/api/whatever/you/wish')
      .expect(200)
      .expect('Access-Control-Allow-Origin', '*')
      .end(done);
  });

  it('uses glob negation to set headers' , function (done) {

    var app = connect()
      .use(headers({
        '!/anything/**': {
          'custom-header': 'for testing'
        }
      }))
      .use(okay);

    request(app)
      .get('/something')
      .expect(200)
      .expect('custom-header', 'for testing')
      .end(done);
  });

  function okay (req, res, next) {

    res.writeHead(200);
    res.end();
  }
});
