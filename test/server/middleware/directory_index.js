var path = require('path');
var setup = require('./_setup');
var expect = setup.expect;
var directoryIndex = require('../../../lib/server/middleware/directory_index');

describe('#directoryIndex() middleware', function() {
  beforeEach(setup.beforeEach);
  
  it('determines if route resolves as directory serving the index.html file', function (done) {
    var path1 = '/contact';
    var path2 = '/about';
    
    directoryIndex(this.req, this.res, function () {
      expect(directoryIndex.internals.isDirectoryIndex(path1)).to.be('/contact/index.html');
      expect(directoryIndex.internals.isDirectoryIndex(path2)).to.be(false);
      
      done();
    });
  });
  
  it('resolves the file path as a directory index', function (done) {
    var self = this;
    this.req.url = '/contact';
    
    directoryIndex(this.req, this.res, function () {
      expect(self.req.superstatic).to.not.be(undefined);
      expect(self.req.superstatic.path).to.be(directoryIndex.internals.router._buildFilePath('/contact/index.html'));
      
      done();
    });
  });
  
  it('redirects to a directory base path if the path, as a clean url, ends with index', function () {
    this.req = { url: '/contact/index' };
    directoryIndex(this.req, this.res, function () {});
    expect(this.res.writeHead.calledWith(301, { Location: '/contact' })).to.be(true);
    expect(this.res.end.called).to.be(true);
  });
  
  it('skips the middleware if the superstatic.path has already been set', function (done) {
    var self = this;
    this.req = {
      superstatic: { path: '/something.html' }
    };
    
    directoryIndex(this.req, this.res, function () {
      expect(self.req.superstatic.path).to.be('/something.html');
      done();
    });
  });
});