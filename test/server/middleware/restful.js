var setup = require('./_setup');
var expect = require('expect.js');
var sinon = require('sinon');
var restful = require('../../../lib/server/middleware/restful');

describe('restful middleware', function() {
  beforeEach(function () {
    this.restful = restful();
    setup.configure(this);
  });
  
  it('skips the middleware if pathname has no match in routes', function () {
    this.req.ss.routes = [];
    this.req._parsedUrl = {pathname: '/nope'};
    this.restful(this.req, this.res, this.next);
    expect(this.next.called).to.equal(true);
  });
  
  it('skips the middleware if request method has no match in routes', function () {
    this.req.ss.routes = [{
      path: '/router',
      method: 'GET'
    }];
    this.req._parsedUrl = {pathname: '/router'};
    this.req.method = 'POST';
    this.restful(this.req, this.res, this.next);
    expect(this.next.called).to.equal(true);
  });
  
  it('runs each validate method in parallel and calls route handler as last item in chain', function (done) {
    this.req.ss.routes = [{
      path: '/cache',
      method: 'GET',
      handler: closeTest,
      validate: {
        headers: function  (req, res, next) {
          headersCalled = true;
          next();
        }
      }
    }];
    
    var headersCalled = false;
    var route = this.req.ss.routes[0]
    this.req._parsedUrl = {pathname: '/cache'};
    this.req.method = 'GET';
    this.restful(this.req, this.res, this.next);
    
    function closeTest () {
      expect(headersCalled).to.be(true);
      done();
    }
  });
});