var path = require('path');
var expect = require('expect.js');
var Local = require('../../../lib/server/store/local');

describe('File store - local', function() {
  beforeEach(function () {
    this.local = new Local({});
    this.filePath = path.resolve(__dirname, '../../fixtures/sample_app/index.html');
  });
  
  it('sets the cwd by default', function () {
    expect(this.local.cwd).to.be(process.cwd());
  });
  
  it('returns th file path', function () {
    expect(this.local.getPath('/path')).to.equal('/path');
  });  
});