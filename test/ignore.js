var expect = require('expect.js');
var ignore = require('../lib/ignore');

describe('ignoring files', function() {
  it('determine if a directory matches an ignore glob', function () {
    expect(ignore.match('/.git')).to.be(true);
    expect(ignore.match('/dir')).to.be(false);
  });
  
  it('determines if a file matches an ignore glob', function () {
    expect(ignore.match('/.git/somefile.js')).to.be(true);
    expect(ignore.match('/somdir/somefile.js')).to.be(false);
  });
})