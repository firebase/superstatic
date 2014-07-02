var middleware = require('./middleware');
var favicon = require('serve-favicon');
var url = require('fast-url-parser');

module.exports = function stacker (app, options) {
  options = options || {};
  
  return function (req, res, next) {
    var pack = stacked();
    var config = req.config;
    var settings = app.settings;
    
    pack.use(middleware.services(app.services, app.servicesRoutePrefix));
    // if (config.redirects) pack.use(middleware.redirect());
    pack.use(middleware.redirect());
    pack.use(middleware.removeTrailingSlash(settings));
    pack.use(middleware.protect(settings));
    if (config.headers) pack.use(middleware.headers(settings));
    pack.use(middleware.sender(app.store));
    if (config.cache_control) pack.use(middleware.cacheControl());
    pack.use(middleware.env(settings, app.localEnv));
    if (config.clean_urls) pack.use(middleware.cleanUrls(settings));
    pack.use(middleware.static(settings));
    if (config.routes) pack.use(middleware.customRoute(settings));
    pack.use(favicon(__dirname + '/templates/favicon.ico'));
    pack.use(middleware.notFound(settings, app.store));
    
    if (options.testMode) return pack;
    
    pack(req, res, next);
  };
};


// TODO: abstract into module
var stacked = function (/* fn1, fn2, ... */) {
  var handle = function (req, res, out) {
    var i = 0;
    
    function next(err) {
      var stackItem = handle.stack[i++];

      if (!stackItem || res.headerSent) {
        // all done
        if (out) return out(err); // delegate to parent

        if (err && res.statusCode < 400) res.statusCode = err.status || 500;
        else res.statusCode = 404;

        return res.end();
      }

      try { stackItem(req, res, next); }
      catch (e) { next(e); }
    }
    
    next();
  };
  
  handle.stack = Array.prototype.slice.call(arguments);
  
  handle.use = function (fn) {
    handle.stack.push(fn);
    return this;
  };
  
  handle.mount = function (path, fn) {
    return this.use(sub(path, fn));
  };
  
  return handle;
};

function sub (mount, fn) {
  if (mount.substr(-1) !== '/') mount += '/';

  return function (req, res, next) {
    var url = req.url;
    var uri = req.uri;

    if (url.substr(0, mount.length) !== mount) return next();

    // modify the URL
    if (!req.realUrl) req.realUrl = url;

    req.url = url.substr(mount.length-1);
    if (req.uri) req.uri = url.parse(req.url);

    fn(req, res, function(err) {
      // reset the URL
      req.url = url;
      req.uri = uri;
      next(err);
    });
  };
}