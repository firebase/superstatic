var expect = require('expect.js');
var superstatic = require('../lib/superstatic');
var SuperstaticServer = require('../lib/server/superstatic_server');
var ignore = require('../lib/ignore');

describe('Exposing superstatic', function() {
  it('exposes Superstatic server', function () {
    expect(superstatic.Server).to.eql(SuperstaticServer);
  });
  
  it('exposes file globs to ignore', function () {
    expect(superstatic.ignore).to.eql(ignore);
  });
});
