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
        stack = packs.stack;
        next();
      });
      
      request(app).get('/').end(done);
    });
    
    expectMiddlewareToMatchAtIndex('services', 0, middleware.services());
    expectMiddlewareToMatchAtIndex('redirect', 1, middleware.redirect());
    expectMiddlewareToMatchAtIndex('remove trailing slash', 2, middleware.removeTrailingSlash());
    expectMiddlewareToMatchAtIndex('protect', 3, middleware.protect());
    expectMiddlewareToMatchAtIndex('headers', 4, middleware.headers());
    expectMiddlewareToMatchAtIndex('sender', 5, middleware.sender());
    expectMiddlewareToMatchAtIndex('cache control', 6, middleware.cacheControl());
    expectMiddlewareToMatchAtIndex('environment variables', 7, middleware.env());
    expectMiddlewareToMatchAtIndex('clean urls', 8, middleware.cleanUrls());
    expectMiddlewareToMatchAtIndex('static', 9, middleware.static());
    expectMiddlewareToMatchAtIndex('custom route', 10, middleware.customRoute());
    expectMiddlewareToMatchAtIndex('favicon', 11, favicon(__dirname + '/fixtures/favicon.ico'));
    expectMiddlewareToMatchAtIndex('not found', 12, middleware.notFound());
    
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

  describe('optionally stacks middleware', function () {
    it('without redirects', function (done) {
      
      // TODO: write function that auto tests that middleware gets left out of stack
      
      var stack;
      var packs;
      var app = createServerWithout('redirects');
      var middelwareStack = stacker(app, {
        testMode: true
      });
      
      app.use(function (req, res, next) {
        packs = middelwareStack(req, res);
        stack = packs.stack;
        next();
      });
      
      request(app)
        .get('/')
        .expect(function () {
          expectMiddlewareToNotExist('redirect', middleware.redirect(), stack);
        })
        .end(done);
    });
  });
  
  
  // function expectMiddlewareToBeToggled (configName, middlewareName, done) {
    
  // }
  
  function expectMiddlewareToNotExist (name, middlware, stack) {
    var atIndex = -1;
    
    stack.forEach(function (item, itemIndex) {
      if (item.toString() === middlware.toString()) atIndex = itemIndex;
    });
    
    if (atIndex > -1) throw new Error('Expected ' + name + ' to not exist in the middleware stack');
  }
  
  function createServerWithout (middleware) {
    var config = {
      redirects: {},
      headers: {},
      cache_control: {},
      clean_urls: true,
      routes: {}
    };
    
    delete config[middleware];
    
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