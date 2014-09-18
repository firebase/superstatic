var stacker = require('../lib/stacker');
var expect = require('chai').expect;
var request = require('supertest');
var connect = require('connect');
var argsList = require('args-list');
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
      app = createServer({
        redirects: {},
        headers: {},
        cache_control: {},
        clean_urls: true,
        routes: {}
      });
      
      var middelwareStack = stacker(app, {
        testMode: true
      });
      
      app.use(function (req, res, next) {
        packs = middelwareStack(req, res);
        stack = packs.layers;
        next();
      });
      
      request(app).get('/').end(done);
    });
    
    expectMiddlewareToMatchAtIndex('services', 0, require('../lib/middleware/services')());
    expectMiddlewareToMatchAtIndex('redirect', 1, require('redirects')());
    expectMiddlewareToMatchAtIndex('remove trailing slash', 2, require('slashify')());
    expectMiddlewareToMatchAtIndex('protect', 3, require('../lib/middleware/protect')());
    expectMiddlewareToMatchAtIndex('headers', 4, require('set-headers')());
    expectMiddlewareToMatchAtIndex('cache control', 5, require('cache-control')());
    expectMiddlewareToMatchAtIndex('environment variables', 6, require('../lib/middleware/env')());
    expectMiddlewareToMatchAtIndex('clean urls', 7, require('clean-urls')());
    expectMiddlewareToMatchAtIndex('static', 8, require('broker')());
    expectMiddlewareToMatchAtIndex('custom route', 9, require('static-router')());
    expectMiddlewareToMatchAtIndex('favicon', 10, favicon(__dirname + '/fixtures/favicon.ico'));
    expectMiddlewareToMatchAtIndex('not found', 11, require('not-found')());
    
    function expectMiddlewareToMatchAtIndex (description, idx, fn) {
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

  describe('optional stack items', function () {
    expectMiddlewareToBeConditional('redirects', require('redirects'));
    expectMiddlewareToBeConditional('headers', require('set-headers'));
    expectMiddlewareToBeConditional('cache_control', require('cache-control'), true);
    expectMiddlewareToBeConditional('clean_urls', require('clean-urls'));
    expectMiddlewareToBeConditional('routes', require('static-router'));
    
    function expectMiddlewareToBeConditional (configName, middlewareMethod, setToFalse) {
      it('includes ' + configName + ' middleware', function (done) {
        var stack;
        var packs;
        var app = createServerWithout(configName, setToFalse)
        var middelwareStack = stacker(app, {
          testMode: true
        });
        
        app.use(function (req, res, next) {
          packs = middelwareStack(req, res);
          stack = packs.layers;
          next();
        });
        
        request(app)
          .get('/')
          .expect(function () {
            expectMiddlewareToNotExist(configName, middlewareMethod(), stack);
          })
          .end(done);
      });
    }
  });
  
  function expectMiddlewareToNotExist (name, middlware, stack) {
    var atIndex = -1;
    
    stack.forEach(function (item, itemIndex) {
      if (item.toString() === middlware.toString()) atIndex = itemIndex;
    });
    
    if (atIndex > -1) throw new Error('Expected ' + name + ' to not exist in the middleware stack');
  }
  
  function createServerWithout (middleware, setToFalse) {
    var config = {
      redirects: {},
      headers: {},
      cache_control: {},
      clean_urls: true,
      routes: {}
    };
    
    setToFalse ? config[middleware] = false : delete config[middleware];
    
    return createServer(config);
  }
  
  
  function createServer (config) {
    config = config || {};
    
    var app = connect()
      .use(function (req, res, next) {
        req.config = config;
        app.settings = {
          _defaults: {}
        };
        next();
      });
    
    return app;
  }
  
});