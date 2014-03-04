var connect = require('connect');
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
  var routes = serverOptions.routes || [];
  var store;
  
  // Handling these values internally because
  // it will be easier to add no "store" types
  // in the future
  if (serverOptions.store.type === 'local') {
    store = new StoreLocal(serverOptions.store.options);
  }
  
  if (serverOptions.store.type === 's3') {
    store = new StoreS3(serverOptions.store.options); 
  }
  
  var server = new SuperstaticServer({
    settings: serverOptions.settings,
    store: store,
    routes: routes,
    port: serverOptions.port,
    host: serverOptions.host
  });
  
  return server;
};

SuperstaticServer.prototype._createServer = function () {
  var settings = this.settings;
  var store = this.store;
  var routes = this.routes;
  
  return this._server = connect()
    .use(connect.logger())
    .use(connect.query())
    .use(connect.compress())
    .use(middleware.restful(routes, settings))
    
    // Setup 
    .use(middleware.configure(settings))
    .use(middleware.removeTrailingSlash())
    
    // Serve files
    .use(middleware.protect(settings))
    .use(middleware.sender(store))
    .use(middleware.cacheControl())
    
    .use(middleware.cleanUrls(settings))
    .use(middleware.static(settings))
    .use(middleware.customRoute(settings))
    
    .use(connect.favicon(__dirname + '/templates/favicon.ico'))
    .use(middleware.notFound(settings, store));
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