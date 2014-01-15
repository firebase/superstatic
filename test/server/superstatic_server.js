var path = require('path');
var http = require('http');
var connect = require('connect');
var expect = require('expect.js');
var redis = require('redis-mock');
var sinon = require('sinon');
var Server = require('../../lib/server/superstatic_server');
var ConfigFile = require('../../lib/server/config/file');
var StoreLocal = require('../../lib/server/store/local');
var StoreS3 = require('../../lib/server/store/s3');
var middleware = require('../../lib/server/middleware');

var PORT = 4000;
var HOST = '127.0.0.1';
var CWD = path.join(process.cwd(), 'test/fixtures/sample_app');

describe('Superstatic server', function() {
  beforeEach(function () {
    this.server = localServer();
  });
  
  it('sets the settings object on the instance', function () {
    expect(this.server.settings).to.not.be(undefined);
  });
  
  it('sets the store object on the instance', function () {
    expect(this.server.settings).to.not.be(undefined);
  });
  
  it('sets the routes list on the instance', function () {
    expect(this.server.settings).to.not.be(undefined);
  });
  
  it('sets the port on the instancje', function () {
    expect(this.server._port).to.be(PORT);
  });
  
  describe('#createServer()', function() {
    it('create and insatnce of SuperstaticServer', function () {
      expect(this.server instanceof Server).to.be(true);
    });
    
    describe('local options', function() {
      beforeEach(function () {
        this.server = localServer();
      });
      
      
      it('configures the settings object as a file', function () {
        expect(this.server.settings instanceof ConfigFile).to.be(true);
      });
      
      it('configures the file store as a file system store', function () {
        expect(this.server.store instanceof StoreLocal).to.be(true);
      });
    })
    
    describe('remote options', function() {
      beforeEach(function () {
        this.server = remoteServer();
      });
      
      it('configures the file store as an s3 bucket', function () {
        expect(this.server.store instanceof StoreS3).to.be(true);
      });
    })
  });

  it('starts the server', function (done) {
    var self = this;
    
    startServer(this.server, function (finished) {
      expect(self.server._server).to.not.be(undefined);
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
        expect(destroySpy.called).to.be(true);
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
        expect(removeSpy.called).to.be(true);
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
      expect(this.stackHandleStr(0)).to.equal(connect.logger('short').toString());
    });
    
    it('uses the query middleware', function () {
      expect(this.stackHandleStr(1)).to.eql(connect.query().toString());
    });
    
    it('uses the connect gzip middleware', function () {
      expect(this.stackHandleStr(2)).to.equal(connect.compress().toString());
    });
    
    it('uses the configure middleware', function () {
      expect(this.stackHandleStr(3)).to.equal(middleware.configure().toString());
    });
    
    it('uses the trailing slash remover middleware', function () {
      expect(this.stackHandleStr(4)).to.equal(middleware.removeTrailingSlash().toString());
    });
    
    it('uses the restful middleware', function () {
      expect(this.stackHandleStr(5)).to.equal(middleware.restful().toString());
    });
    
    it('uses the basic auth protect middlware', function () {
      expect(this.stackHandleStr(6)).to.equal(middleware.protect().toString());
    });
    
    it('uses the basic auth sender middlware', function () {
      expect(this.stackHandleStr(7)).to.equal(middleware.sender().toString());
    });
    
    it('uses the cache control middleware', function () {
      expect(this.stackHandleStr(8)).to.equal(middleware.cacheControl().toString());
    });
    
    it('uses the custom route middleware', function () {
      expect(this.stackHandleStr(9)).to.equal(middleware.customRoute().toString());
    });
    
    it('uses the clean urls middleware', function () {
      expect(this.stackHandleStr(10)).to.equal(middleware.cleanUrls().toString());
    });
    
    it('uses the static middleware', function () {
      expect(this.stackHandleStr(11)).to.equal(middleware.static().toString());
    });
    
    it('uses the default favicon middleware', function () {
      expect(this.stackHandleStr(12)).to.eql(connect.favicon().toString());
    });
    
    it('uses the not found middleware', function () {
      expect(this.stackHandleStr(13)).to.equal(middleware.notFound().toString());
    });
  });
});

function startServer (server, callback) {
  server.start(function () {
    // Suppress all connect.logger output
    if (server._server.stack[0].handle.toString() === connect.logger().toString()) {
      server._server.stack[0].handle = function (req, res, next) {next();};
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
    settings: localSettings(),
    store: localStore()
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
  var config = new ConfigFile({
    file: 'superstatic.json',
    cwd: CWD,
    config: {
      routes: []
    }
  });
  
  return {
    type: 'file',
    base: config
  };
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