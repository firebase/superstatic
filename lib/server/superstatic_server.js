var connect = require('connect');
var ConfigFile = require('./config/file');
var StoreLocal = require('./store/local');
var StoreS3 = require('./store/s3');
var middleware = require('./middleware');

var _ = require('lodash');
var minimatch = require('minimatch');
var path = require('path');
var send = require('send');
var qs = require('querystring');

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
    settings = serverOptions.settings.base;
  }
  
  if (serverOptions.settings.type === 'redis') {
    settings = serverOptions.settings.base;
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
  /*
    Serving order:
    ---------------
      1. Custom routes
      2. Clean urls
      3. Static (includes directory index)
      4. Favicon
   */
  return this._server = connect()
    .use(connect.logger())
    .use(connect.query())
    
    // Set up router helpers
    .use(middleware.router(this.settings, this.store, this.routes))
    
    // Set up custom routes
    .use(middleware.restful())
    
    // Prepare our cache
    .use(middleware.settingsCache)
    
    // Handle protected environments
    .use(middleware.protect())
    
    // .use(middleware.cacheControl) // - move this before serving?
    
    //// File server (new)
    
    // Custom routes
    .use(function (req, res, next) {
      // TODO: handle setting this somewhere else
      // On app load, if no config is present, just make a blank object
      if (!req.ss.config) return next();
      
      var pathname = req.ss.pathname;
      var filePath = req.ss.config.routes[_.find(
        _.keys(req.ss.config.routes),
        function (route) {
          return minimatch(path.join('/', pathname), path.join('/', route));
        }
      )];
    
      if (!filePath) return next();
      
      send(req, filePath)
        .root(req.ss.config.cwd)
        .on('error', function () {
          next();
        })
        .pipe(res);
    })
    
    // Clean urls
    .use(function (req, res, next) {
      if (!req.ss.config || !req.ss.config.clean_urls) return next();
      if (req.ss.isHtml(req.ss.pathname)) return redirectAsCleanUrl(res, req.ss.pathname, req.query)
      if (!isCleanUrl(req, req.ss.pathname)) return next();
      
      var filePath = path.join('/', req.ss.config.root, req.ss.pathname + '.html');
      
      send(req, filePath)
        .root(req.ss.config.cwd)
        .on('error', function (err) {
          next()
        })
        .pipe(res);
      
      function isCleanUrl (req, pathname) {
        return req.ss.settings.isFile(fullPath(req, pathname));
      }
      
      function fullPath (req, pathname) {
        var root = req.ss.config.root || './';
        return path.join('/', root, pathname + '.html');
      }
      
      function redirectAsCleanUrl (res, pathname, query) {
        var query = qs.stringify(query);
        var redirectUrl = path.join(
          '/', path.dirname(pathname),
          path.basename(pathname, '.html')
        );
        
        redirectUrl += (query) ? '?' + query : '';
        res.writeHead(301, { Location: redirectUrl });
        res.end();
      }
    })
    
    // File serving (original)
    // .use(middleware.static)
    // .use(middleware.customRoute)
    // .use(middleware.directoryIndex)
    // .use(middleware.cleanUrls)
    // .use(connect.favicon(__dirname + '/templates/favicon.ico'))
    
    // Used for redirect?
    // NOt sure why we use this.
    .use(middleware.removeTrailingSlash)
    
    // Send response
    .use(connect.compress())
    .use(middleware.notFound)
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