var fs = require('fs');
var path = require('path');
var http = require('http');
var connect = require('connect');
var expect = require('chai').expect;
var sinon = require('sinon');
var superstatic = require('../lib');
var serverDefaults = require('../lib/defaults');
var ConfigFile = require('../lib/settings/file');
var StoreLocal = require('../lib/store/local');
var StoreS3 = require('../lib/store/s3');
var middleware = require('../lib/middleware');
var request = require('request');
var mkdirp = require('mkdirp');
var query = require('connect-query');
var compress = require('compression');
var logger = require('morgan');
var favicon = require('serve-favicon');
var static = require('serve-static');

var PORT = 4000;
var HOST = '127.0.0.1';
var CWD = path.join(process.cwd(), 'test/fixtures/sample_app');

describe('Superstatic server', function() {
  
  beforeEach(function () {
    this.server = localServer();
  });
  
  it('exposes the default settings', function () {
    expect(superstatic.defaultSettings).to.not.equal(undefined);
  });
  
  it('sets the settings object on the instance', function () {
    expect(this.server.settings).to.not.equal(undefined);
  });
  
  it('sets the store object on the instance', function () {
    expect(this.server.store).to.not.equal(undefined);
  });
  
  it('sets the routes list on the instance', function () {
    expect(this.server.routes).to.not.equal(undefined);
  });
  
  it('sets the port on the instance', function () {
    expect(this.server.port).to.equal(PORT);
  });
  
  it('sets the current working directory on the instance', function () {
    expect(this.server.cwd).to.equal(process.cwd() + '/');
  });
  
  it('sets the services list', function () {
    expect(Object.keys(this.server.services)).to.eql(['service1']);
  });
  
  it('sets the service list to empty if no service list or provided', function () {
    var server = superstatic();
    expect(server.services).to.eql(serverDefaults.SERVICES);
  });
  
  it('sets the service route prefix', function () {
    var server = superstatic({
      servicesRoutePrefix: '--'
    });
    expect(server.servicesRoutePrefix).to.equal('--');
  });
  
  it('sets the default services route prefix if none is given', function () {
    var server = superstatic();
    expect(server.servicesRoutePrefix).to.equal(serverDefaults.SERVICES_ROUTE_PREFIX);
  });
  
  it('lets you start and stop the server', function (done) {
    var server = this.server;
    server.start(function () {
      server.stop(done);
    });
  });
  
  it.skip('turns debug output off', function (done) {
    var server = superstatic({
      port: PORT,
      debug: false
    });
    
    server.start(function () {
      expect(server.debug).to.equal(false);
      // expect(server.logger().toString()).to.equal(Server.middlewareNoop.toString());
      server.stop(done);
    });
  });
  
  describe('local or remote options', function() {
    
    beforeEach(function () {
      this.server = localServer();
    });
    
    it('configures a localEnv', function () {
      expect(this.server.localEnv).to.not.equal(undefined);
    });

    it('configures the settings object as a file', function () {
      expect(this.server.settings).to.not.equal(undefined);
    });
    
    it('configures the file store as a file system store', function () {
      expect(superstatic().store instanceof StoreLocal).to.equal(true);
    });
    
    it('configures the file store as an s3 bucket', function () {
      expect(superstatic({store: {type: 's3'}}).store instanceof StoreS3).to.equal(true);
    });
    
  });
  
  it('adds a route to the server', function () {
    var routeDef = {
      path: '/route',
      method: 'GET',
      handler: function (req, res) {
        res.end();
      }
    };
    this.server.route(routeDef);
    expect(this.server.routes).to.eql([routeDef]);
  });
  
  describe('middleware', function() {
    
    it('uses the logger middleware', expectMiddleware(logger(), 0));
    it('uses the query middleware', expectMiddleware(query(), 1));
    it('uses the connect gzip middleware', expectMiddleware(compress(), 2));
    it('uses the restful middleware', expectMiddleware(middleware.restful(), 3));
    it('uses the configure middleware', expectMiddleware(middleware.configure(), 4));
    it('uses the services middleware', expectMiddleware(middleware.services(), 5));
    it('uses the reirect middleware', expectMiddleware(middleware.redirect(), 6));
    it('uses the trailing slash remover middleware', expectMiddleware(middleware.removeTrailingSlash(), 7));
    it('uses the basic auth protect middlware', expectMiddleware(middleware.protect(), 8));
    it('uses the basic auth sender middlware', expectMiddleware(middleware.sender(), 9));
    it('uses the cache control middleware', expectMiddleware(middleware.cacheControl(), 10));
    it('uses the env middleware', expectMiddleware(middleware.env(), 11));
    it('uses the clean urls middleware', expectMiddleware(middleware.cleanUrls(), 12));
    it('uses the static middleware', expectMiddleware(middleware.static(), 13));
    it('uses the custom route middleware', expectMiddleware(middleware.customRoute(), 14));
    it('uses the default favicon middleware', expectMiddleware(favicon(path.resolve(__dirname, '../lib/templates/favicon.ico')), 15));
    it('uses the not found middleware', expectMiddleware(middleware.notFound(), 16));
    
    function expectMiddleware (fn, idx, done) {
      return function (done) {
        var server = superstatic();
        server.start(function () {
          expect(server.stack[idx].handle.toString()).to.equal(fn.toString());
          server.stop(done);
        });
      };
    }
    
    it('lets you inject custom middleware into the chain', function (done) {
      var middlewareExecuted = false;
      var server = superstatic({
        port: PORT,
        cwd: CWD,
        debug: false
      });
      
      server.use(function customMiddlewareTest (req, res, next) {
        middlewareExecuted = true;
        next();
      });
      
      server.start(function () {
        request('http://localhost:' + PORT, function (err, response) {
          expect(middlewareExecuted).to.equal(true);
          server.stop(done);
        });
      });
    });
    
    it('injects custom middleware with all arguments', function (done) {
      var middlewareExecuted = false;
      var server = superstatic({
        port: PORT,
        cwd: __dirname,
        debug: false
      });
      
      mkdirp.sync(__dirname + '/__testing');
      
      // Guard against file not getting deleted at some point
      if (fs.exists(__dirname + '/__testing/index.html')) fs.unlink(__dirname + '/__testing/index.html');
      
      fs.writeFileSync(__dirname + '/__testing/index.html', 'testing index.html');
      
      server.use('/public', static(__dirname + '/__testing'));
      
      server.start(function () {
        request('http://localhost:' + PORT + '/public/index.html', function (err, response) {
          expect(response.statusCode).to.equal(200);
          expect(response.body).to.equal('testing index.html');
          
          fs.unlink(__dirname + '/__testing/index.html');
          fs.rmdirSync(__dirname + '/__testing');
          server.stop(done);
        });
      });
    });
  });

});

function localServer () {
  return superstatic({
    port: PORT,
    host: HOST,
    environment: {},
    settings: localSettings(),
    store: localStore(),
    error_page: 'error.html',
    not_found_page: 'not_found.html',
    cwd: process.cwd() + '/',
    services: {
      service1: function (req, res, next) {
        next();
      }
    }
  });
}

function remoteServer() {
  return superstatic({
    port: PORT,
    host: HOST,
    settings: redisSettings(),
    store: s3Store()
  });
}

function localSettings () {
  return new ConfigFile({
    file: 'superstatic.json',
    cwd: CWD,
    config: {
      routes: []
    }
  });
}

function redisSettings () {
  return {};
}

function localStore () {
  return {
    type: 'local',
    options: {
      cwd: CWD
    }
  };
}

function s3Store () {
  return {
    type: 's3',
    options: {
      key: 'key',
      secret: 'secret',
      bucket: 'bucket'
    }
  };
}