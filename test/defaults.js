var expect = require('expect.js');
var defaults = require('../lib/defaults');
var minimatch = require('minimatch');
var _ = require('lodash');

describe('defaults', function() {
  it('has a default port', function () {
    expect(defaults.PORT).to.equal(3474);
  });
  
  it('has a default host', function () {
    expect(defaults.HOST).to.equal('127.0.0.1');
  });
  
  it('has a default directory', function () {
    expect(defaults.DIRECTORY).to.equal(process.cwd());
  });
  
  it('defaults to glob matching ".git" directories and nested fiels', function () {
    var matchedGlob1 = _.find(defaults.IGNORE, function (glob) {
      return minimatch('/.git/file.js', glob);
    });
    
    var matchedGlob2 = _.find(defaults.IGNORE, function (glob) {
      return minimatch('/.git', glob);
    });
    
    expect(matchedGlob1).to.not.be(undefined);
    expect(matchedGlob2).to.not.be(undefined);
  });
})