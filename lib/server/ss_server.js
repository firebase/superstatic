var fs = require('fs');
var connect = require('connect');
var mime = require('mime');
var SsConfigFile = require('./config/ss_config_file');
var SsStoreLocal = require('./store/ss_store_local');
var SsRouter = require('./ss_router');
var middleware = require('./middleware');

var Superstatic = function (options) {
  this._server = options.server;
  this._port = options.port;
  this._host = options.host;
  this.settings = options.settings;
  this.store = options.store;
  this.router = options.router;
};

Superstatic.createServer = function (serverOptions) {
  var settings;
  var store;
  
  if (serverOptions.settings.type === 'file') {
    settings = new SsConfigFile(serverOptions.settings.options);
  }
  
  if (serverOptions.store.type === 'local') {
    store = new SsStoreLocal(serverOptions.store.options);
  }
  
  var router = new SsRouter({
    settings: settings
  });
  
  var server = new Superstatic({
    settings: settings,
    store: store,
    router: router,
    port: serverOptions.port,
    host: serverOptions.host,
  });
  
  return server;
};

Superstatic.prototype._createServer = function () {
  // The order of these middleware modules is DEATHLY important!!!
  return this._server = connect()
    .use(middleware.router(this.settings))
    .use(middleware.static)
    .use(this.router.customRoute.bind(this.router))
    .use(middleware.directoryIndex)
    .use(middleware.cleanUrls)
    .use(middleware.removeTrailingSlash)
    .use(middleware.notFound)
    .use(this.dispatcher.bind(this.router));
};

Superstatic.prototype.parseRoute = function (req, res, next) {
  req.superstatic = req.superstatic || {};
  req.superstatic.path =  this.router.resolvePath(req.url);
  
  next();
};

Superstatic.prototype.dispatcher = function (req, res) {
  res.setHeader('Content-Type', mime.lookup(req.superstatic.path));
  fs.createReadStream(req.superstatic.path).pipe(res).on('end', function () {
    res.end();
  });
};

Superstatic.prototype.start = function (callback) {
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

Superstatic.prototype.stop = function (callback) {
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

module.exports = Superstatic;