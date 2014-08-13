// var mongoose = require('mongoose');
// var mockgoose = require('mockgoose');

// mockgoose(mongoose);

var track = require('../../../lib/middleware/services/track');
var expect = require('chai').expect;

describe('services tracker', function () {
  var tracker;
  
  beforeEach(function () {
    tracker = track({
      name: 'app-name',
      services: {
        proxy: {
          limit: 0,
          used: 0,
          exceeded: false
        }
      }
    });
  });
  
  describe('no tracking', function () {
    it('it always sets the service as available', function (done) {
      tracker.serviceAvailable('anything', function (err, available) {
        expect(available).to.equal(true);
        done();
      })
    });
    
    it('does nothing when recording usage', function (done) {
      tracker.recordUsage('proxy', {}, function (err) {
        expect(err).to.equal(undefined);
        done();
      });
    });
  });
  
  describe('tracking services', function () {
    it('determines if the service is available', function (done) {
      tracker.serviceAvailable('proxy', function (err, available) {
        expect(available).to.equal(true);
        done();
      });
    });
    
    it('records the usage for a service', function (done) {
      tracker.recordUsage('proxy', {}, function (err) {
        expect(err).to.equal(undefined);
        done();
      });
    });
  });
  
});