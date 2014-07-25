var track = require('../../../lib/middleware/services/track');
var expect = require('chai').expect;

describe.only('services tracker', function () {
  var tracker;
  
  beforeEach(function () {
    tracker = track({
      name: 'app-name'
    });
  });
  
  it('determines if the service is available');
  
  it('records the usage for a service', function (done) {
    tracker.recordUsage('proxy', {}, function (err) {
      expect(err).to.equal(undefined);
      done();
    });
  });
});