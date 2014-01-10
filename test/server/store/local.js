var path = require('path');
var expect = require('expect.js');
var Local = require('../../../lib/server/store/local');

describe('File store - local', function() {
  beforeEach(function () {
    this.local = new Local({});
    this.filePath = '/test/fixtures/sample_app/index.html';
  });
  
  it('sets the cwd by default', function () {
    expect(this.local.cwd).to.be(process.cwd());
  });
  
  it('sets the mime type of a file', function () {
    expect(this.local.get(this.filePath).type).to.be('text/html');
  });
  
  it('streams the file contents from the given path', function () {
    expect(this.local.get(this.filePath).pipe).to.not.be(undefined);
  });
})