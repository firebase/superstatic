var connect = require('connect');
var http = require('http');
var query = require('connect-query');
var compress = require('compression');
var logger = require('morgan');
var favicon = require('serve-favicon');
var _ = require('lodash');
var StoreLocal = require('./store/local');
var StoreS3 = require('./store/s3');
var middleware = require('./middleware');
var ConfigFile = require('./settings/file');
var serverDefaults = require('./defaults');

var superstatic = module.exports = function (options) {
  options = options || {};
  
  var server;
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
  
  app.use(logger({skip: function (req, res) {
    return !app.debug;
  }}));
  
  app.use(query());
  app.use(compress()),
  app.use(middleware.restful(app.routes, app.settings)),
  app.use(middleware.configure(app.settings));
  
  app.start = function (cb) {
    app.use(middleware.services(this.services, this.servicesRoutePrefix));
    app.use(middleware.redirect());
    app.use(middleware.removeTrailingSlash(app.settings));
    app.use(middleware.protect(app.settings));
    app.use(middleware.sender(app.store));
    app.use(middleware.cacheControl());
    app.use(middleware.env(app.settings, app.localEnv));
    app.use(middleware.cleanUrls(app.settings));
    app.use(middleware.static(app.settings));
    app.use(middleware.customRoute(app.settings));
    app.use(favicon(__dirname + '/templates/favicon.ico'));
    app.use(middleware.notFound(app.settings, app.store));
    
    server = http.createServer(app);
    server.listen(app.port, app.host, cb);
  };
  
  app.stop = function (cb) {
    server.close(cb);
  };
  
  app.route = function (routeOptions) {
    app.routes.push(routeOptions);
  };
  
  return app;
};

// TODO: why do we need this?
superstatic.defaultSettings = require('./settings/default');

function generateStore (storeSettings, cwd) {
  if (!storeSettings) return new StoreLocal(cwd || serverDefaults.DIRECTORY);
  if (storeSettings.type === 'local') return new StoreLocal(cwd || serverDefaults.DIRECTORY);
  if (storeSettings.type === 's3') return new StoreS3(storeSettings.options); 
}