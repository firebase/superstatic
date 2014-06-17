var connect = require('connect');
var http = require('http');
var query = require('connect-query');
var compress = require('compression');
var networkLogger = require('morgan');
var favicon = require('serve-favicon');
var _ = require('lodash');
var StoreLocal = require('./store/local');
var StoreS3 = require('./store/s3');
var middleware = require('./middleware');
var ConfigFile = require('./settings/file');
var serverDefaults = require('./defaults');

module.exports = superstatic;

function superstatic (options) {
  options = options || {};
  
  var defaults = {
    port: serverDefaults.PORT,
    host: serverDefaults.HOST,
    cwd: serverDefaults.DIRECTORY,
    services: serverDefaults.SERVICES,
    servicesRoutePrefix: serverDefaults.SERVICES_ROUTE_PREFIX,
    routes: [],
    settings: new ConfigFile(options),
    localEnv: {}
  };
  
  var app = _.extend(connect(), defaults, options, {
    store: generateStore(options.store, options.cwd)
  });
  
  app.use(networkLogger({skip: function (req, res) {
    return !app.debug;
  }}));
  app.use(middleware.logger(app.debug, app.logger));
  app.use(query());
  app.use(compress()),
  app.use(middleware.restful(app.routes, app.settings)),
  app.use(middleware.configure(app.settings));
  
  app._start = function (cb) {
    app.use(middleware.services(this.services, this.servicesRoutePrefix));
    app.use(middleware.redirect());
    app.use(middleware.removeTrailingSlash(app.settings));
    app.use(middleware.protect(app.settings));
    app.use(middleware.headers(app.settings));
    app.use(middleware.sender(app.store));
    app.use(middleware.cacheControl());
    app.use(middleware.env(app.settings, app.localEnv));
    app.use(middleware.cleanUrls(app.settings));
    app.use(middleware.static(app.settings));
    app.use(middleware.customRoute(app.settings));
    app.use(favicon(__dirname + '/templates/favicon.ico'));
    app.use(middleware.notFound(app.settings, app.store));
    
    app.server = http.createServer(app);
    app.server.listen(app.port, app.host, cb);
    
    return app.server;
  };
  
  app.listen = function (port, host, cb) {
    if (typeof arguments[0] === 'number' && app.port === serverDefaults.PORT) app.port = arguments[0];
    if (typeof arguments[1] === 'string' && app.host === serverDefaults.HOST) app.host = arguments[1];
    if (typeof arguments[0] === 'function') cb = arguments[0];
    if (typeof arguments[1] === 'function') cb = arguments[1];
    
    return app._start(cb);
  };
  
  app.close = function () {
    app.server.close.apply(app.server, arguments);
  };
  
  app.route = function (routeOptions) {
    app.routes.push(routeOptions);
  };
  return app;
}

// TODO: why do we need this?
superstatic.defaultSettings = require('./settings/default');

function generateStore (storeSettings, cwd) {
  if (!storeSettings) return new StoreLocal(cwd || serverDefaults.DIRECTORY);
  if (storeSettings.type === 'local') return new StoreLocal(cwd || serverDefaults.DIRECTORY);
  if (storeSettings.type === 's3') return new StoreS3(storeSettings.options); 
}