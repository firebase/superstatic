var setup = require('./_setup');
var expect = setup.expect;
var directoryIndex = require('../../../lib/server/middleware/directory_index');

describe('#directoryIndex() middleware', function() {
  beforeEach(setup.beforeEachMiddleware);
  
  describe('skipping middleware', function() {
    it('skips if no config object available', function () {
      delete this.req.ss.config;
      setup.skipsMiddleware.call(this, directoryIndex);
    });
    
    it('skips middleware if superstatic path is alread set', function () {
      this.req.superstatic = { path: '/superstatic.html' };
      directoryIndex(this.req, this.res, this.next);
      expect(this.next.called).to.equal(true);
    });
    
    it('skips middleware if url is not a directory index', function () {
      setup.skipsMiddleware.call(this, directoryIndex);
    });
  });
  
  it('redirects to directory level if url base name is "index"', function () {
    this.req.url = '/contact/index.html';
    directoryIndex(this.req, this.res, this.next);
    
    expect(this.res.writeHead.calledWith(301, {Location: '/contact'})).to.be(true);
    expect(this.res.end.called).to.equal(true);
  });
  
  it('sets the path to the closest "index.html" file if url is a directory index path', function () {
    this.req.url = '/contact';
    directoryIndex(this.req, this.res, this.next);
    
    expect(this.next.called).to.be(true);
    expect(this.req.superstatic.path).to.be('/contact/index.html');
  });
  
  it('sets the relative path', function () {
    this.req.url = '/contact';
    directoryIndex(this.req, this.res, this.next);
    
    expect(this.next.called).to.be(true);
    expect(this.req.superstatic.relativePath).to.be('/contact/index.html');
  });
});