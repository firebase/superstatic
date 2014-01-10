var expect = require('expect.js');
var setup = require('./_setup');
var cleanUrls = require('../../../lib/server/middleware/clean_urls');

describe('clean urls middleware', function () {
  beforeEach(function () {
    this.cleanUrls = cleanUrls();
    setup.configure(this);
    this.req.config.clean_urls = true;
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
      this.req.settings.isFile = function () {return false;};
      this.req.ss.pathname = '/superstatic';
      this.cleanUrls(this.req, this.res, this.next);
      
      expect(this.next.called).to.equal(true);
    })
  });
});












// var setup = require('./_setup');
// var path = require('path');
// var expect = setup.expect;
// var cleanUrls = require('../../../lib/server/middleware/clean_urls');

// describe('#cleanUrls() middleware', function() {
//   beforeEach(setup.beforeEachMiddleware);
  
//   describe('skipping middleware', function() {
//     it('skips if no config object available', function () {
//       delete this.req.ss.config;
//       setup.skipsMiddleware.call(this, cleanUrls);
//     });
    
//     it('skips if clean urls are turned off', function () {
//       setup.skipsMiddleware.call(this, cleanUrls);
//     });

//     it('skips middleware if it is not an html file and clean urls are on', function () {
//       this.req.ss.config.config.clean_urls = true;
//       this.req.ss.pathname = '/superstatic.png';
//       setup.skipsMiddleware.call(this, cleanUrls);
//     });
    
//     it('skips middleware if superstatic path is alread set', function () {
//       this.req.superstatic = { path: '/superstatic.html' };
//       cleanUrls(this.req, this.res, this.next);
//       expect(this.next.called).to.equal(true);
//     });
//   });
  
//   it('sets the request path when clean urls are turned on and it is a clean url', function () {
//     this.req.ss.pathname = '/test';
//     this.req.ss.config.config.clean_urls = true;
//     cleanUrls(this.req, this.res, this.next);
    
//     expect(this.next.called).to.equal(true);
//     expect(this.req.superstatic.path).to.be('/test.html');
//   });
  
//   it('sets the relative path', function () {
//     this.req.ss.pathname = '/test';
//     this.req.ss.config.config.clean_urls = true;
//     cleanUrls(this.req, this.res, this.next);
    
//     expect(this.next.called).to.equal(true);
//     expect(this.req.superstatic.relativePath).to.be('/test.html');
//   });
  
//   it('redirects if url is an html file and clean urls are turned on', function () {
//     this.req.ss.config.config.clean_urls = true;
//     cleanUrls(this.req, this.res, this.next);
    
//     expect(this.res.writeHead.calledWith(301, {Location: '/superstatic'}));
//     expect(this.res.end.called).to.equal(true);
//   });
  
//   it('preserves the query parameters on redirect', function () {
//     this.req.url = '/superstatic.html?query=param';
//     this.req.ss.pathname = '/superstatic.html';
//     this.req.query = {query: 'param'};
    
//     cleanUrls.internals.redirect(this.req, this.res);
    
//     expect(this.res.writeHead.args[0][1]).to.eql({Location: '/superstatic?query=param'});
//     expect(this.res.end.called).to.equal(true);
//   });
// });