var expect = require('chai').expect;
var defaults = require('../lib/defaults');
var minimatch = require('minimatch');
var _ = require('lodash');

describe('defaults', function() {
  it('has a default port', function () {
    expect(defaults.PORT).to.equal(process.env.PORT || 3474);
  });
  
  it('has a default host', function () {
    expect(defaults.HOST).to.equal('127.0.0.1');
  });
  
  it('has a default directory', function () {
    expect(defaults.DIRECTORY).to.equal(process.cwd());
  });
})