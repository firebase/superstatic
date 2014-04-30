var connect = require('connect');
var StoreLocal = require('./store/local');
var StoreS3 = require('./store/s3');
var middleware = require('./middleware');
var ConfigFile = require('./settings/file');
var serverDefaults = require('../defaults');

var Server = function (options) {
  options = options || {};
  
  this._port = options.port || serverDefaults.PORT;
  this._host = options.host || serverDefaults.HOST;
  this._cwd = options.cwd || serverDefaults.DIRECTORY;
  this._debug = options.debug;
  this._middleware = [];
  
  this.store = Server.storeFactory(options.store, options.cwd);
  this.routes = options.routes || [];
  this.localEnv = options.environment;
  
  this.settings = options.settings || new ConfigFile({
    config: options.config,
    cwd: options.cwd,
    _defaults: options._defaults
  });
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
  var settings = this.settings;
  var store = this.store;
  var routes = this.routes;
  var localEnv = this.localEnv;
  
  this._client = connect()
    .use(this.logger())
    .use(connect.query())
    .use(connect.compress());
    
  // Custom middleware
  this._middleware.forEach(function (args) {
    this.use.apply(this, args);
  }.bind(this._client));

  this._client
    .use(middleware.restful(routes, settings))
    
    // Setup 
    .use(middleware.configure(settings))
    .use(middleware.removeTrailingSlash(settings))
    
    // Serve files
    .use(middleware.protect(settings))
    .use(middleware.sender(store))
    .use(middleware.cacheControl())
    
    .use(middleware.env(settings, localEnv))
    
    .use(middleware.cleanUrls(settings))
    .use(middleware.static(settings))
    .use(middleware.customRoute(settings))
    
    .use(connect.favicon(__dirname + '/templates/favicon.ico'))
    .use(middleware.notFound(settings, store));
  
  return this._client;
};

Server.prototype.use = function () {
  this._middleware.push(arguments);
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

module.exports = Server;