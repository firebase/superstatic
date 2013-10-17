var path = require('path');
var setup = require('./_setup');
var expect = setup.expect;
var ssDirectoryIndex = require('../../../lib/server/middleware/ss_directory_index');

describe('#ssDirectoryIndex() middleware', function() {
  beforeEach(setup.beforeEach);
  
  it('determines if route resolves as directory serving the index.html file', function (done) {
    var path1 = '/contact';
    var path2 = '/about';
    
    ssDirectoryIndex(this.req, this.res, function () {
      expect(ssDirectoryIndex.internals.isDirectoryIndex(path1)).to.be('/contact/index.html');
      expect(ssDirectoryIndex.internals.isDirectoryIndex(path2)).to.be(false);
      
      done();
    });
  });
  
  it('resolves the file path as a directory index', function (done) {
    var self = this;
    this.req.url = '/contact';
    
    ssDirectoryIndex(this.req, this.res, function () {
      expect(self.req.superstatic).to.not.be(undefined);
      expect(self.req.superstatic.path).to.be(ssDirectoryIndex.internals.router._buildFilePath('/contact/index.html'));
      
      done();
    });
  });
  
  it('redirects to a directory base path if the path, as a clean url, ends with index', function () {
    this.req = { url: '/contact/index' };
    ssDirectoryIndex(this.req, this.res, function () {});
    expect(this.res.writeHead.calledWith(301, { Location: '/contact' })).to.be(true);
    expect(this.res.end.called).to.be(true);
  });
});