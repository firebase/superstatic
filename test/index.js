var expect = require('expect.js');
var superstatic = require('../lib');
var SuperstaticServer = require('../lib/server');
var defaultSettings = require('../lib/server/settings/default');

describe('Exposing superstatic', function() {
  it('exposes Superstatic server', function () {
    expect(superstatic.Server).to.eql(SuperstaticServer);
  });
  
  it('exposes the default settings', function () {
    expect(superstatic.defaultSettings).to.eql(defaultSettings);
  });
});
