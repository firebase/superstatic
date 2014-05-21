var connect = require('connect');
var StoreLocal = require('./store/local');
var StoreS3 = require('./store/s3');
var middleware = require('./middleware');
var ConfigFile = require('./settings/file');
var serverDefaults = require('../defaults');
var asArray = require('as-array');
var query = require('connect-query');
var compress = require('compression');

var Server = function (options) {
  options = options || {};
  
  this._port = options.port || serverDefaults.PORT;
  this._host = options.host || serverDefaults.HOST;
  this._cwd = options.cwd || serverDefaults.DIRECTORY;
  this._debug = options.debug;
  this._services = options.services || serverDefaults.SERVICES;
  this._servicesRoutePrefix = options.servicesRoutePrefix || serverDefaults.SERVICES_ROUTE_PREFIX;
  
  var store = this.store = Server.storeFactory(options.store, options.cwd);
  var routes = this.routes = options.routes || [];
  var localEnv = this.localEnv = options.environment;
  
  var settings = this.settings = options.settings || new ConfigFile({
    config: options.config,
    cwd: options.cwd,
    _defaults: options._defaults
  });
  
  this._customMiddleware = [];
  
  this._middlewareChain = [
    this.logger(),
    query(),
    compress(),
    
    middleware.restful(routes, settings),
    
    // Setup 
    middleware.configure(settings),
    middleware.services(this._services, this._servicesRoutePrefix),    
    
    middleware.redirect(),
    middleware.removeTrailingSlash(settings),
    
    // Serve files
    middleware.protect(settings),
    middleware.sender(store),
    middleware.cacheControl(),
    
    middleware.env(settings, localEnv),
    middleware.cleanUrls(settings),
    middleware.static(settings),
    middleware.customRoute(settings),
    
    connect.favicon(__dirname + '/templates/favicon.ico'),
    middleware.notFound(settings, store)
  ];
};

Server.createServer = function (serverOptions) {
  return new Server(serverOptions);
};

Server.storeFactory = function (storeSettings, cwd) {
  if (!storeSettings) return new StoreLocal(cwd || serverDefaults.DIRECTORY);
  if (storeSettings.type === 'local') return new StoreLocal(cwd || serverDefaults.DIRECTORY);
  if (storeSettings.type === 's3') return new StoreS3(storeSettings.options); 
};

Server.middlewareNoop = function (req, res, next) {
  next();
};

Server.prototype.logger = function (description) {
  return (this._debug === false)
    ? Server.middlewareNoop
    : connect.logger();
};

Server.prototype._createServer = function () {
  var customMiddleChainIndex = 4;
  var client = this._client = connect();
  
  if (this._customMiddleware.length) {
    this._middlewareChain = insertAt(this._middlewareChain, customMiddleChainIndex, this._customMiddleware);
  }
  
  this._middlewareChain.forEach(function (m) {
    client.use.apply(client, asArray(m));
  });
  
  return client;
};

Server.prototype.use = function () {
  this._customMiddleware.push(arguments);
};

Server.prototype.start = function (callback) {
  this._createServer();
  var openServer = this._openServer = this._client.listen(this._port, callback);
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

Server.prototype.stop = function (callback) {
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

// TODO: mange this with the module "way"
Server.prototype.route = function (routeOptions) {
  this.routes.push(routeOptions);
};

function insertAt (insertTo, idx , insertFrom) {
  insertTo.splice.apply(insertTo, [idx, 0].concat(insertFrom));
  return insertTo;
}

module.exports = Server;