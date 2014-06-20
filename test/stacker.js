var stacker = require('../lib/stacker');
var expect = require('chai').expect;
var request = require('supertest');
var connect = require('connect');
var argsList = require('args-list');
var middleware = require('../lib/middleware');
var favicon = require('serve-favicon');

describe('stacker', function () {
  
  it('builds a stack of middleware and returns a single middleware function', function () {
    var app = createServer();
    var stack = stacker(app);
    
    expect(stack).to.be.a('function');
    expect(argsList(stack)).to.eql(['req', 'res', 'next']);
  });
  
  describe('middleware order:', function () {
    var app;
    var stack;
    
    beforeEach(function (done) {
      app = createServer();
      
      var middelwareStack = stacker(app, {
        testMode: true
      });
      
      app.use(function (req, res, next) {
        packs = middelwareStack(req, res);
        stack = packs.stack;
        next();
      });
      
      request(app).get('/').end(done);
    });
    
    expectToMatchAtIndex('services', 0, middleware.services());
    expectToMatchAtIndex('redirect', 1, middleware.redirect());
    expectToMatchAtIndex('remove trailing slash', 2, middleware.removeTrailingSlash());
    expectToMatchAtIndex('protect', 3, middleware.protect());
    expectToMatchAtIndex('headers', 4, middleware.headers());
    expectToMatchAtIndex('sender', 5, middleware.sender());
    expectToMatchAtIndex('cache control', 6, middleware.cacheControl());
    expectToMatchAtIndex('environment variables', 7, middleware.env());
    expectToMatchAtIndex('clean urls', 8, middleware.cleanUrls());
    expectToMatchAtIndex('static', 9, middleware.static());
    expectToMatchAtIndex('custom route', 10, middleware.customRoute());
    expectToMatchAtIndex('favicon', 11, favicon(__dirname + '/fixtures/favicon.ico'));
    expectToMatchAtIndex('not found', 12, middleware.notFound());
    
    function expectToMatchAtIndex (description, idx, fn) {
      it(description, function () {
        try {
          expect(stack[idx].toString()).to.equal(fn.toString());
        }
        catch (e) {
          var atIndex = -1;
          var errorMessage = 'Expected ' + description + ' middleware to be at index ' + idx;
          
          stack.forEach(function (item, itemIndex) {
            if (item.toString() === fn.toString()) atIndex = itemIndex;
          });
          
          if (atIndex > -1) errorMessage += ' but found it at index ' + atIndex;
          
          throw new Error(errorMessage);
        }
      });
    }
  });
  
  
  function createServer () {
    var app = connect()
      .use(function (req, res, next) {
        req.config = {};
        app.settings = {
          _defaults: {}
        };
        next();
      });
    
    return app;
  }
  
});