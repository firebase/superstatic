var setup = require('./_setup');
var expect = setup.expect;
var sinon = require('sinon');
var router = require('../../../lib/server/middleware/router');
var _ = require('lodash');
var connect = require('connect');

describe('#router() middleware', function() {
  beforeEach(setup.beforeEachMiddleware);
  
  it('creates our ss namespace', function () {
    expect(this.req.ss).to.not.be(undefined);
  });
  
  it('adds the settings object to the namespace', function () {
    expect(this.req.ss.settings).to.not.be(undefined);
  });
  
  it('adds the store object to the namespace', function () {
    expect(this.req.ss.store).to.not.be(undefined);
  });
  
  it('adds the cache client to the namespace', function () {
    expect(this.req.ss.cache).to.not.be(undefined);
  });
  
  it('adds the routes list to the namespace', function () {
    expect(this.req.ss.routes).to.not.be(undefined);
  });
  
  it('adds the router to the namespace', function () {
    expect(this.req.ssRouter).to.not.be(undefined);
  });
  
  it('parses the url pathname without the query parameters', function () {
    var req = setup.req();
    req.url = '/params.html?param=one&another=two';
    req.ss.pathname = null;
    
    setup.setupRouter(req, this.res, this.next);
    
    expect(req.ss.pathname).to.equal('/params.html');
    expect(req.ss.pathname.indexOf('?')).to.equal(-1);
  });
  
  it('builds a file path according to the current working directory and root of project', function () {
    this.req.ss.config.cwd = 'cwd';
    this.req.ss.config.root = 'root';
    expect(this.req.ssRouter._buildFilePath('/filePath')).to.equal('/cwd/root/filePath');
  });
  
  it('builds a relative file path according to the root of the projects', function () {
    this.req.ss.config.root = 'root';
    expect(this.req.ssRouter._buildRelativePath('/filePath')).to.equal('/root/filePath');
  });
  
  it('determines if a given path is a file in the file list', function () {
    var isFileSpy = this.req.ss.settings.isFile = sinon.spy();
    this.req.ssRouter.isFile('/superstatic.html');
    expect(isFileSpy.called).to.be(true);
  });
  
  it('determines if a file is an html file', function () {
    expect(this.req.ssRouter.isHtml('/superstatic.html')).to.be(true);
    expect(this.req.ssRouter.isHtml('/superstatic.png')).to.be(false);
  });
});