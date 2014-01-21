var expect = require('expect.js');
var setup = require('./_setup');
var cleanUrls = require('../../../lib/server/middleware/clean_urls');
var defaultSettings = require('../../../lib/server/settings/default');
var defaultFileStore = require('../../../lib/server/store/default');

// TODO: test as a middleware for a connect server

describe('clean urls middleware', function () {
  var settings;
  var fileStore;
  
  beforeEach(function () {
    settings = defaultSettings.create();
    fileStore = defaultFileStore.create();
    this.cleanUrls = cleanUrls(settings, fileStore);
    setup.configure(this);
    settings.configuration.clean_urls = true;
    this.req.config = settings.configuration;
  });
  
  it('redirects to the clean url path when static html file is requested', function () {
    this.req.ss.pathname = '/superstatic.html';
    this.cleanUrls(this.req, this.res, this.next);
    expect(this.res.writeHead.calledWith(301, {Location: '/superstatic'})).to.equal(true);
    expect(this.res.end.called).to.equal(true);
  });
  
  it('it redirects and keeps the query string', function () {
    this.req.ss.pathname = '/superstatic.html?test=ing';
    this.req.query = {
      test: 'ing'
    };
    this.cleanUrls(this.req, this.res, this.next);
    expect(this.res.writeHead.calledWith(301, {Location: '/superstatic?test=ing'})).to.equal(true);
    expect(this.res.end.called).to.equal(true);
  });
  
  it('serves the .html version of the clean url if clean_urls are on', function () {
    this.req.ss.pathname = '/superstatic';
    this.cleanUrls(this.req, this.res, this.next);
    expect(this.next.called).to.equal(false);
    expect(this.res.send.calledWith('/superstatic.html')).to.equal(true);
  });
  
  describe('skips middleware', function() {
    it('skips the middleware if clean_urls are turned off', function () {
      this.req.config.clean_urls = false;
      this.cleanUrls(this.req, this.res, this.next);
      
      expect(this.next.called).to.equal(true);
    });
    
    it('skips the middleware if it is the root path', function () {
      this.req.config.clean_urls = false;
      this.req.ss.pathname = '/';
      this.cleanUrls(this.req, this.res, this.next);
      
      expect(this.next.called).to.equal(true);
    });
    
    it('skips the middleware if it is not a clean url and clean_urls are on', function () {
      fileStore.exists = function () {return false;}
      
      this.req.ss.pathname = '/superstatic';
      this.cleanUrls(this.req, this.res, this.next);
      
      expect(this.next.called).to.equal(true);
    })
  });
});