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
    
    it('skips middleware if superstatic path is already set', function () {
      this.req.superstatic = { path: '/superstatic.html' };
      directoryIndex(this.req, this.res, this.next);
      expect(this.next.called).to.equal(true);
    });
    
    it('skips middleware if url is not a directory index', function () {
      setup.skipsMiddleware.call(this, directoryIndex);
    });
    
    it('skips the middleware if index.html does not exists', function () {
      this.req.url = '/no_index';
      this.req.ss.pathname = '/no_index';
      setup.skipsMiddleware.call(this, directoryIndex);
    });
  });
  
  it('sets the path to the closest "index.html" file if url is a directory index path', function () {
    this.req.ss.pathname = '/contact';
    directoryIndex(this.req, this.res, this.next);
    
    expect(this.next.called).to.be(true);
    expect(this.req.superstatic.path).to.be('/contact/index.html');
  });
  
  it('sets the relative path', function () {
    this.req.ss.pathname = '/contact';
    directoryIndex(this.req, this.res, this.next);
    
    expect(this.next.called).to.be(true);
    expect(this.req.superstatic.relativePath).to.be('/contact/index.html');
  });
  
  it('redirects to directory level if url base name is "index"', function () {
    this.req.ss.pathname = '/contact/index.html';
    directoryIndex(this.req, this.res, this.next);
    
    expect(this.res.writeHead.calledWith(301, {Location: '/contact'})).to.be(true);
    expect(this.res.end.called).to.equal(true);
  });
  
  it('preservers the query parameters on redirect', function () {
    this.req.url = '/contact/index.html?query=param';
    this.req.ss.pathname = '/contact/index.html';
    this.req.query = {query: 'param'};
    
    directoryIndex.internals.redirect(this.req, this.res);
    
    expect(this.res.writeHead.args[0][1]).to.eql({Location: '/contact?query=param'});
    expect(this.res.end.called).to.equal(true);
  });
});