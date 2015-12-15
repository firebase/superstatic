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
var memoryProvider = require('../../../lib/providers/memory');
var RSVP = require('rsvp');

describe('memory provider', function() {
  var store;
  var provider;
  beforeEach(function() {
    store = store || {};
    provider = memoryProvider({store: store});
  });

  it('should resolve null if not in the store', function() {
    return expect(provider({}, '/whatever')).to.eventually.be.null;
  });

  it('should return a stream of the content if found', function(done) {
    store['/index.html'] = 'foobar';
    return provider({}, '/index.html').then(function(result) {
      var out = '';
      result.stream.on('data', function(data) {
        out += data;
      });
      result.stream.on('end', function() {
        expect(out).to.eq('foobar');
        done();
      });
    });
  });

  it('should return an etag of the content', function() {
    store['/a.html'] = 'foo';
    store['/b.html'] = 'bar';
    return RSVP.hash({a: provider({}, '/a.html'), b: provider({}, '/b.html')}).then(function(result) {
      expect(result.a.etag).not.to.be.null;
      expect(result.b.etag).not.to.be.null;
      expect(result.a.etag).not.to.eq(result.b.etag);
    });
  });

  it('should return the length of content', function() {
    store['/index.html'] = 'foobar';
    return expect(provider({}, '/index.html')).to.eventually.have.property('size', 6);
  });

  afterEach(function() {
    store = null;
  });
});
