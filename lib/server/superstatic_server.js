var fs = require('fs');
var connect = require('connect');
var ConfigFile = require('./config/file');
var ConfigRedis = require('./config/redis');
var StoreLocal = require('./store/local');
var StoreS3 = require('./store/s3');
var middleware = require('./middleware');

var SuperstaticServer = function (options) {
  this._server = options.server;
  this._port = options.port;
  this._host = options.host;
  
  this.settings = options.settings;
  this.store = options.store;
  this.routes = options.routes;
};

SuperstaticServer.createServer = function (serverOptions) {
  var settings;
  var store;
  var routes = serverOptions.routes || [];
  
  if (serverOptions.settings.type === 'file') {
    settings = new ConfigFile(serverOptions.settings.options);
  }
  
  if (serverOptions.settings.type === 'redis') {
    settings = new ConfigRedis(serverOptions.settings.options);
  }
  
  if (serverOptions.store.type === 'local') {
    store = new StoreLocal(serverOptions.store.options);
  }
  
  if (serverOptions.store.type === 's3') {
    store = new StoreS3(serverOptions.store.options); 
  }
  
  var server = new SuperstaticServer({
    settings: settings,
    store: store,
    routes: routes,
    port: serverOptions.port,
    host: serverOptions.host,
  });
  
  return server;
};

SuperstaticServer.prototype._createServer = function () {
  // The order of these middleware modules is DEATHLY important!!!
  return this._server = connect()
    .use(connect.logger(function (tokens, req, res) {
      // TODO: make this dynamic
      //  - Dio - show detailed loggin
      //  - Superstatic - flag turns on the logging
    }))
    .use(connect.query())
    .use(middleware.router(this.settings, this.store, this.routes))
    .use(middleware.restful())
    .use(middleware.settingsCache)
    .use(middleware.static)
    .use(middleware.customRoute)
    .use(middleware.directoryIndex)
    .use(middleware.cleanUrls)
    .use(middleware.removeTrailingSlash)
    .use(connect.compress())
    .use(middleware.notFound)
    .use(middleware.cacheControl)
    .use(middleware.responder);
};

SuperstaticServer.prototype.start = function (callback) {
  this._createServer();
  var openServer = this._openServer = this._server.listen(this._port, callback);
  openServer._connects = openServer._connects || {};
  
  // Track all connections
  openServer.on('connection', function (connection) {
    var key = connection.remoteAddress + ':' + connection.remotePort;
    openServer._connects[key] = connection;
    
    connection.once('close', function() {
      delete openServer._connects[key];
    });
  });
};

SuperstaticServer.prototype.stop = function (callback) {
  var openServer = this._openServer;
  
  // Close all connections
  Object.keys(openServer._connects).forEach(function (key) {
    var connection = openServer._connects[key];
    return connection && connection.destroy();
  });
  
  openServer.close(function () {
    openServer.removeAllListeners();
    callback();
  });
};

SuperstaticServer.prototype.route = function (routeOptions) {
  this.routes.push(routeOptions);
};

module.exports = SuperstaticServer;