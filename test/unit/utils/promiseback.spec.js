'use strict';

var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = chai.expect;

var RSVP = require('rsvp');
var promiseback = require('../../../lib/utils/promiseback');

describe('promiseback', function() {
  it('should resolve a promise if one is returned', function() {
    return expect(promiseback(function(a1, a2) {
      return RSVP.resolve({
        a: a1,
        b: a2
      });
    }, 2)('foo', 'bar')).to.eventually.deep.eq({
      a: 'foo',
      b: 'bar'
    });
  });

  it('should reject a promise if one is rejected', function() {
    return expect(promiseback(function() {
      return RSVP.reject('broken');
    }, 2)('foo', 'bar')).to.be.rejectedWith('broken');
  });

  it('should reject an errback if one is used and errors', function() {
    return expect(promiseback(function(a1, a2, cb) {
      cb(a2);
    }, 2)('foo', 'bar')).to.be.rejectedWith('bar');
  });

  it('should resolve an errback if one is used and resolves', function() {
    return expect(promiseback(function(a1, a2, cb) {
      cb(null, a2);
    }, 2)('foo', 'bar'));
  });
});
