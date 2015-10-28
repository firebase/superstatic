/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var connect = require('connect');
var request = require('supertest');
var expect = require('chai').expect;

var superstatic = require('../../');

describe('response helpers', function () {

  it('removes helpers no files served', function (done) {

    var hasHelpers = false;

    var app = connect()
      .use(superstatic({
        config: {
          root: './'
        }
      }))
      .use(function (req, res, next) {

        if (res.__ !== undefined) {
          hasHelpers = true;
        }

        next();
      });

    request(app)
      .get('/')
      .expect(404)
      .expect(function () {

        expect(hasHelpers).to.equal(false);
      })
      .end(done);
  });
});
