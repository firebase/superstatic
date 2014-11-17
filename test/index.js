var fs = require('fs');
var path = require('path');
var http = require('http');
var connect = require('connect');
var expect = require('chai').expect;
var superstatic = require('../lib');
var serverDefaults = require('../lib/defaults');
var ConfigFile = require('../lib/settings/file');
var StoreLocal = require('../lib/store/local');
var StoreS3 = require('../lib/store/s3');
var get = require('request');
var request = require('supertest');
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
  
  describe('tracking', function () {
    it('tracks nothing by default', function () {
      var server = superstatic();
      expect(server.track).to.eql([]);
    });
    
    it('sets the app to track service usage', function () {
      var server = superstatic({
        track: ['services']
      });
      expect(server.track).to.eql(['services']);
    });
  });
  
  describe('secure server', function () {
    it('started', function (done) {
      var server = superstatic({
        secure: {
          key: fs.readFileSync(path.join(__dirname, 'fixtures/key.pem')),
          cert: fs.readFileSync(path.join(__dirname, 'fixtures/cert.pem'))
        }
      });
      
      server.listen(function (err) {
        expect(err).to.equal(undefined);
        expect(server.server).to.contain.keys(['key', 'cert']);
        server.close(done);
      });
    });
    
    it('requires a key', function () {
      var server = superstatic({
        secure: {
          cert: 'a'
        }
      });
      
      expect(function () {
        server.listen();
      }).to.throw(Error);
    });
    
    it('requires a cert', function () {
      var server = superstatic({
        secure: {
          key: 'a'
        }
      });
      
      expect(function () {
        server.listen();
      }).to.throw(Error);
    });
  });
  
  it('listens on the default port', function (done) {
    var app = superstatic({
      testMode: true
    });
    
    app.listen(function () {
      expect(app.port).to.equal(process.env.PORT || 3474);
      done();
    });
  });
  
  it('listens on the port given to the #listen() function', function (done) {
    var app = superstatic({
      testMode: true
    });
    
    app.listen(5432, function () {
      expect(app.port).to.equal(5432);
      done();
    });
  });
  
  it('listens on the host given to the #listen() function', function (done) {
    var app = superstatic({
      testMode: true
    });
    
    app.listen(5432, '0.0.0.0', function () {
      expect(app.host).to.equal('0.0.0.0');
      done();
    });
  });
  
  it('listens on the port passed as an option to the #listen() function', function (done) {
    var app = superstatic({
      port: 7654,
      testMode: true
    });
    
    app.listen(5432, function () {
      expect(app.port).to.equal(7654);
      done();
    });
  });
  
  it('listens on the host passed as an option to the #listen() function', function (done) {
    var app = superstatic({
      host: '0.0.0.0',
      testMode: true
    });
    
    app.listen(5432, '1.1.1.1', function () {
      expect(app.host).to.equal('0.0.0.0');
      done();
    });
  });
  
  it('the #listen() method returns the http server object', function (done) {
    var app = superstatic();
    var server = app.listen(function () {
      var http = require('http');
      expect(server).to.be.an.instanceOf(http.Server);
      app.close(done);
    });
  });
  
  it('can be used as the callback function in #http.createServer()');
  
  // it.skip('turns debug output off', function (done) {
  //   var server = superstatic({
  //     port: PORT,
  //     debug: false
  //   });
    
  //   server.listen(function () {
  //     expect(server.debug).to.equal(false);
  //     // expect(server.logger().toString()).to.equal(Server.middlewareNoop.toString());
  //     server.close(done);
  //   });
  // });
  
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
    
    it('overwrites the file store default', function () {
      var server = superstatic({
        store: {
          _legacyClient: {},
          _hashedClient: {}
        }
      });
      
      expect(server.store._legacyClient).to.not.equal(undefined);
      expect(server.store._hashedClient).to.not.equal(undefined);
    });
    
  });
  
  it('can prepend middleware to the beginning of the middleware stack', function (done) {
    var prependCalled = false;
    var app = superstatic({
      debug: false,
      _prepend: function (req, res, next) {
        prependCalled = true;
        next();
      }
    });
    
    request(app)
      .get('/')
      .expect(function () {
        expect(prependCalled).to.equal(true);
      })
      .end(done);
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
  
  it('passes option to toggle gzip compression', function () {
    var app = superstatic({
      gzip: false
    });
    
    expect(app.stack.length).to.equal(5);
  });
  
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
    
    server.listen(function () {
      get('http://localhost:' + PORT, function (err, response) {
        expect(middlewareExecuted).to.equal(true);
        server.close(done);
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
    fs.writeFileSync(__dirname + '/__testing/index.html', 'testing index.html');
    server.use('/public', static(__dirname + '/__testing'));
    
    server.listen(function () {
      get('http://localhost:' + PORT + '/public/index.html', function (err, response) {
        expect(response.statusCode).to.equal(200);
        expect(response.body).to.equal('testing index.html');
        
        fs.unlinkSync(__dirname + '/__testing/index.html');
        fs.rmdirSync(__dirname + '/__testing');
        server.close(done);
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