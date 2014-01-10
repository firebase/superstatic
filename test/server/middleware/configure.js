var setup = require('./_setup');
var expect = require('expect.js');
var sinon = require('sinon');
var configure = require('../../../lib/server/middleware/configure');
var _ = require('lodash');
var connect = require('connect');

describe('configure middleware', function() {
  beforeEach(function () {
    var self = this;
    this.ctx = {};
    this.config = {};
    this.configure = configure(this.ctx);
    setup.configure(this);
    
    this.ctx.settings = this.req.settings;
    this.ctx.store = {};
    this.ctx.routes = {};
    this.req.settings.load = function (hostname, next) {
      next(null, self.config);
    };
    this.configure(this.req, this.res, this.next);
  });
  
  it('creates our ss namespace', function () {
    expect(this.req.ss).to.not.equal(undefined);
  });
  
  it('adds the settings object to the namespace', function () {
    expect(this.req.settings).to.not.be(undefined);
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
  
  it('parses the url pathname without the query parameters', function () {
    this.req.ss.pathname = null;
    this.req.url = '/params.html'
    this.configure(this.req, this.res, this.next);
    expect(this.req.ss.pathname).to.equal('/params.html');
    expect(this.req.ss.pathname.indexOf('?')).to.equal(-1);
  });
  
  it('loads the settings', function () {
    this.configure(this.req, this.res, this.next);
    expect(this.req.config).to.eql(this.config);
  });
  
  it('sets the default index file', function () {
    this.configure(this.req, this.res, this.next);
    expect(this.req.config.index).to.equal('index.html');
  });
  
  it('completes with the callback', function () {
    this.configure(this.req, this.res, this.next);
    expect(this.next.called).to.equal(true);
  });
});