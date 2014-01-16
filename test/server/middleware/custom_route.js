var path = require('path');
var expect = require('expect.js');
var setup = require('./_setup');
var customRoute = require('../../../lib/server/middleware/custom_route');

describe('custom route middleware', function() {
  beforeEach(function () {
    this.customRoute = customRoute();
    setup.configure(this);
    
    this.req.config.routes = {
      'test1': 'superstatic.html',
      'test2': 'superstatic.html',
      'test3': 'test/dir'
    };
  });
  
  it('serves the mapped route file for a custom route', function () {
    this.req.ss.pathname = '/test1';
    this.customRoute(this.req, this.res, this.next);
    expect(this.res.send.calledWith('/superstatic.html')).to.equal(true);
  });
  
  it('serves the index file of a directory if mapped route is mapped to a directory', function () {
    this.req.ss.pathname = '/test3';
    this.customRoute(this.req, this.res, this.next);
    expect(this.res.send.calledWith('/test/dir/index.html')).to.equal(true);
  });
  
  it('serves the mapped route file for a custom route with a declared root', function () {
    var self = this;
    this.req.ss.pathname = '/test1';
    this.req.config.root = './public';
    this.req.rootPathname = function (pathname) {
      return path.join('/', self.req.config.root, pathname);
    };
    
    this.customRoute(this.req, this.res, this.next);
    expect(this.res.send.calledWith('/public/superstatic.html')).to.equal(true);
  });
  
  it('skips the middleware if there is no custom route', function () {
    this.customRoute(this.req, this.res, this.next);
    expect(this.next.called).to.equal(true);
    expect(this.res.send.called).to.equal(false);
  });
  
  it('skips the middleware if the custom route is for a file that does not exist', function () {
    this.req.settings.isFile = function () { return false; };
    this.customRoute(this.req, this.res, this.next);
    expect(this.next.called).to.equal(true);
    expect(this.res.send.called).to.equal(false);
  });
  
  describe('glob matching', function() {
    it('maps all paths to the same pathname', function () {
      this.req.ss.pathname = '/anything/can/work';
      this.req.config.routes = {
        '**': 'superstatic.html'
      };
      
      this.customRoute(this.req, this.res, this.next);
      expect(this.res.send.calledWith('/superstatic.html'));
    });
    
    it('maps all requests to files in a given directory to the same pathname', function () {
      this.req.ss.pathname = '/subdir/anything/here';
      this.req.config.routes = {
        'subdir/**': 'superstatic.html'
      };
      this.customRoute(this.req, this.res, this.next);
      expect(this.res.send.calledWith('/superstatic.html')).to.equal(true);
    });
  })
});