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
  
  it('determines if the service is available', function () {
    expect(tracker.serviceAvailable('proxy')).to.equal(true);
  });
  
  it('records the usage for a service', function (done) {
    tracker.recordUsage('proxy', {}, function (err) {
      expect(err).to.equal(undefined);
      done();
    });
  });
});