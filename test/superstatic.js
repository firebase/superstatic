var expect = require('expect.js');
var superstatic = require('../lib');
var SuperstaticServer = require('../lib/server');
var ignore = require('../lib/ignore');
var defaultSettings = require('../lib/server/settings/default');

describe('Exposing superstatic', function() {
  it('exposes Superstatic server', function () {
    expect(superstatic.Server).to.eql(SuperstaticServer);
  });

  it('exposes file globs to ignore', function () {
    expect(superstatic.ignore).to.eql(ignore);
  });

  it('exposes the default settings', function () {
    expect(superstatic.defaultSettings).to.eql(defaultSettings);
  });
});
