var fs = require('fs');
var path = require('path');
var http = require('http');
var connect = require('connect');
var expect = require('chai').expect;
var sinon = require('sinon');
var Server = require('../../lib/server');
var serverDefaults = require('../../lib/defaults');
var ConfigFile = require('../../lib/server/settings/file');
var StoreLocal = require('../../lib/server/store/local');
var StoreS3 = require('../../lib/server/store/s3');
var middleware = require('../../lib/server/middleware');
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
  
  it('sets the settings object on the instance', function () {
    expect(this.server.settings).to.not.equal(undefined);
  });
  
  it('sets the store object on the instance', function () {
    expect(this.server.settings).to.not.equal(undefined);
  });
  
  it('sets the routes list on the instance', function () {
    expect(this.server.settings).to.not.equal(undefined);
  });
  
  it('sets the port on the instance', function () {
    expect(this.server._port).to.equal(PORT);
  });
  
  it('sets the current working directory on the instance', function () {
    expect(this.server._cwd).to.equal(process.cwd() + '/');
  });
  
  it('sets the services list', function () {
    expect(Object.keys(this.server._services)).to.eql(['service1']);
  });
  
  it('sets the service list to empty if no service list or provided', function () {
    var server = new Server();
    expect(server._services).to.eql(serverDefaults.SERVICES);
  });
  
  it('sets the service route prefix', function () {
    var server = new Server({
      servicesRoutePrefix: '--'
    });
    expect(server._servicesRoutePrefix).to.equal('--');
  });
  
  it('sets the default services route prefix if none is given', function () {
    var server = new Server();
    expect(server._servicesRoutePrefix).to.equal(serverDefaults.SERVICES_ROUTE_PREFIX);
  });
  
  describe('#createServer()', function() {
    it('create and instance of SuperstaticServer', function () {
      expect(this.server instanceof Server).to.equal(true);
    });
    
    describe('local options', function() {
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
        expect(this.server.store instanceof StoreLocal).to.equal(true);
      });
      
      it('turns debug output off', function (done) {
        var server = new Server({
          port: PORT,
          debug: false
        });
        
        server.start(function () {
          expect(server._debug).to.equal(false);
          expect(server.logger().toString()).to.equal(Server.middlewareNoop.toString());
          server.stop(done);
        });
      });
    })
    
    describe('remote options', function() {
      beforeEach(function () {
        this.server = remoteServer();
      });
      
      it('configures the file store as an s3 bucket', function () {
        expect(this.server.store instanceof StoreS3).to.equal(true);
      });
    })
  });

  it('starts the server', function (done) {
    var self = this;
    
    startServer(this.server, function (finished) {
      expect(self.server._client).to.not.equal(undefined);
      finished(done);
    });
  });
  
  it('tracks all open connections', function (done) {
    var self = this;
    startServer(this.server, function (finished) {
      self.server._openServer.on('connection', function () {
        expect(self.server._openServer._connects).to.not.eql({});
      });
      
      httpGet('/', function (data) {
        finished(done);
      });
    });
  });
  
  it('closes all connections when server is stopped', function (done) {
    var self = this;
    var destroySpy = sinon.spy();
    
    startServer(this.server, function (finsished) {
      self.server._openServer._connects.someConnection = {
        destroy: destroySpy
      };
      self.server.stop(function () {
        expect(destroySpy.called).to.equal(true);
        done();
      });
    });
  });
  
  it('removes all listensers when server is stopped', function (done) {
    var self = this;
    var removeSpy = sinon.spy();
    
    startServer(this.server, function (finsished) {
      self.server._openServer.removeAllListeners = removeSpy;
      self.server.stop(function () {
        expect(removeSpy.called).to.equal(true);
        done();
      });
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
    beforeEach(function () {
      this._connectServer = this.server._createServer();
      this.stack = this._connectServer.stack;
      
      this.stackHandleStr = function (idx) {
        return this.stack[idx].handle.toString();
      }
    });
    
    it('uses the logger middleware', function () {
      expect(this.stackHandleStr(0)).to.equal(logger('short').toString());
    });
    
    it('uses the query middleware', function () {
      expect(this.stackHandleStr(1)).to.eql(query().toString());
    });
    
    it('uses the connect gzip middleware', function () {
      expect(this.stackHandleStr(2)).to.equal(compress().toString());
    });
    
    it('uses the restful middleware', function () {
      expect(this.stackHandleStr(3)).to.equal(middleware.restful().toString());
    });
    
    it('uses the configure middleware', function () {
      expect(this.stackHandleStr(4)).to.equal(middleware.configure().toString());
    });
    
    it('uses the services middleware', function () {
      expect(this.stackHandleStr(5)).to.equal(middleware.services().toString());
    });
    
    it('uses the reirect middleware', function () {
      expect(this.stackHandleStr(6)).to.equal(middleware.redirect().toString());
    });
    
    it('uses the trailing slash remover middleware', function () {
      expect(this.stackHandleStr(7)).to.equal(middleware.removeTrailingSlash().toString());
    });
    
    it('uses the basic auth protect middlware', function () {
      expect(this.stackHandleStr(8)).to.equal(middleware.protect().toString());
    });
    
    it('uses the basic auth sender middlware', function () {
      expect(this.stackHandleStr(9)).to.equal(middleware.sender().toString());
    });
    
    it('uses the cache control middleware', function () {
      expect(this.stackHandleStr(10)).to.equal(middleware.cacheControl().toString());
    });
    
    it('users the env middleware', function () {
      expect(this.stackHandleStr(11)).to.equal(middleware.env().toString());
    });
    
    it('uses the clean urls middleware', function () {
      expect(this.stackHandleStr(12)).to.equal(middleware.cleanUrls().toString());
    });
    
    it('uses the static middleware', function () {
      expect(this.stackHandleStr(13)).to.equal(middleware.static().toString());
    });
    
    it('uses the custom route middleware', function () {
      expect(this.stackHandleStr(14)).to.equal(middleware.customRoute().toString());
    });
    
    it('uses the default favicon middleware', function () {
      expect(this.stackHandleStr(15)).to.eql(favicon(path.resolve(__dirname, '../../lib/server/templates/favicon.ico')).toString());
    });
    
    it('uses the not found middleware', function () {
      expect(this.stackHandleStr(16)).to.equal(middleware.notFound().toString());
    });
    
    it('lets you inject custom middleware into the chain', function (done) {
      var middlewareExecuted = false;
      var server = new Server({
        port: PORT,
        cwd: CWD,
        debug: false
      });
      
      server.use(function customMiddlewareTest (req, res, next) {
        middlewareExecuted = true;
        next();
      });
      
      startServer(server, function (finished) {
        request('http://localhost:' + PORT, function (err, response) {
          expect(middlewareExecuted).to.equal(true);
          finished(done);
        });
      });
    });
    
    it('injects custom middleware with all arguments', function (done) {
      var middlewareExecuted = false;
      var server = new Server({
        port: PORT,
        cwd: __dirname,
        debug: false
      });
      
      mkdirp.sync(__dirname + '/__testing');
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

function startServer (server, callback) {
  server.start(function () {
    // Suppress all logger output
    if (server._client.stack[0].handle.toString() === logger().toString()) {
      server._client.stack[0].handle = function (req, res, next) {next();};
    }
    
    callback(function (done) {
      server.stop(done);
    });
  });
}

function httpGet(path, callback) {
  http.get('http://localhost:' + PORT + path, function (res) {
    var data = '';
    res.on('data', function (chunk) {
      data += chunk.toString();
    }).on('end', function () {
      callback(data);
    });
  });
}

function localServer () {
  return Server.createServer({
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
  return Server.createServer({
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