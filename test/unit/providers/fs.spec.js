/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

'use strict';
var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = chai.expect;
var path = require('path');
var RSVP = require('rsvp');

var fsp = require('../../../lib/providers/fs');

var concatStream = require('concat-stream');
var readStatStream = function(stat) {
  var stream = stat.stream;
  return new RSVP.Promise(function(resolve, reject) {
    stream.on('error', function(err) {
      return reject(err);
    });

    stream.pipe(concatStream({encoding: 'string'}, function(str) {
      return resolve(str);
    }));
  });
};

describe('provider: fs', function() {
  var opts = {};

  beforeEach(function() {
    opts = {
      cwd: path.resolve(path.join(__dirname, '..', '..', 'fixtures')),
      public: 'a'
    };
  });

  it('should return stat information for a file that exists', function() {
    return fsp(opts)({}, '/index.html').then(readStatStream).then(function(body) {
      expect(body).to.eq('A\n');
    });
  });

  it('should return null for a file that does not exist', function() {
    return expect(fsp(opts)({}, '/bogus.html')).to.eventually.be.null;
  });

  describe('multiple publics', function() {
    beforeEach(function() {
      opts.public = ['a', 'b'];
    });

    it('should return the first file found for multiple publics', function() {
      return fsp(opts)({}, '/index.html').then(readStatStream).then(function(body) {
        expect(body).to.eq('A\n');
        return fsp(opts)({}, '/b.html').then(readStatStream);
      }).then(function(body) {
        expect(body).to.eq('B\n');
      });
    });

    it('should return null if neither public has the file', function() {
      return expect(fsp(opts)({}, '/bogus.html')).to.eventually.be.null;
    });
  });
});
