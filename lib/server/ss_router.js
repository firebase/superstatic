var path = require('path');
var minimatch = require('minimatch');
var mime = require('mime');

var SsRouter = function (options) {
  this.settings = options.settings
  this.cleanUrls = this.settings.configuration.clean_urls || false;
  this.routes = this.settings.configuration.routes || {};
  this.files = this.settings.configuration.files || [];
};

SsRouter.prototype.isFile = function (filePath) {
  return this.files.indexOf(filePath) > -1;
};

SsRouter.prototype.isHtml = function (filePath) {
  return path.extname(filePath) === '.html';
};

SsRouter.prototype.isStatic = function (filePath) {
  var isFile = false;
  
  if (this.cleanUrls && this.isHtml(filePath)) {
    isFile = false;
  }
  else{
    if (this.isFile(filePath)) {
      isFile = this._buildFilePath(filePath);
    }
  }
  
  return isFile;
};

SsRouter.prototype.isDirectoryIndex = function (filePath) {
  var isIndex = false;
  var fullPath = this._buildRelativePath(path.join(filePath, 'index.html'));
  
  if (this.isFile(fullPath)) {
    isIndex = path.join(filePath, 'index.html');
  }
  
  return isIndex;
};

SsRouter.prototype.isCleanUrl = function (filePath) {
  var finalPath = false;
  var fullPath = this._buildRelativePath(filePath + '.html');
  
  if (this.isFile(fullPath)) finalPath = fullPath;
  
  return finalPath;
};

SsRouter.prototype.isCustomRoute = function (filePath) {
  var customRoute;
  var self = this;
  filePath = path.join('/', filePath);
  
  Object.keys(this.routes).forEach(function (key) {
    var route = path.join('/', key);
    if (minimatch(filePath, route)) customRoute = self.routes[key];
  });
  
  return customRoute;
};

SsRouter.prototype._buildFilePath = function (filePath) {
  return path.join(this.settings.cwd, this.settings.configuration.root, filePath || '');
  // return path.join(this.settings.cwd, filePath || '');
};

SsRouter.prototype._buildRelativePath = function (filePath) {
  return path.join('/', this.settings.configuration.root, filePath);
  
};

SsRouter.prototype.static = function (req, res, next) {
  if (this.cleanUrls && this.isHtml(req.url)) return next();
  
  var static = this.isStatic(this._buildRelativePath(req.url));
  
  if(!static) return next();
  
  req.superstatic = req.superstatic || {};
  req.superstatic.path =  this._buildFilePath(req.url);
  
  next();
};

SsRouter.prototype.customRoute = function (req, res, next) {
  if (req.superstatic && req.superstatic.path) return next();
  
  var customRoute = this.isCustomRoute(req.url);
  
  if (!customRoute) return next();
  
  req.superstatic = req.superstatic || {};
  req.superstatic.path =  this._buildFilePath(customRoute);
  
  next();
};

SsRouter.prototype.directoryIndex = function (req, res, next) {
  if (req.superstatic && req.superstatic.path) return next();
  
  if (path.basename(req.url) === 'index') {
    res.writeHead(301, { Location: path.dirname(req.url) });
    return res.end();
  }
  var index = this.isDirectoryIndex(req.url);
  
  if (!index) return next();
  
  req.superstatic = req.superstatic || {};
  req.superstatic.path =  this._buildFilePath(index);

  next();
};

SsRouter.prototype.cleanUrl = function (req, res, next) {
  if (req.superstatic && req.superstatic.path) return next();
  var url = this.isCleanUrl(req.url);
  
  if (this.cleanUrls && this.isHtml(req.url)) {
    var redirectUrl = path.join('/', path.dirname(req.url), path.basename(req.url, '.html'));
    
    res.writeHead(301, {Location: redirectUrl});
    return res.end();
  }
  
  if (!url) return next();
  
  req.superstatic = req.superstatic || {};
  req.superstatic.path = this._buildFilePath(url);

  next();
};

SsRouter.prototype.notFound = function (req, res, next) {
  if (!req.superstatic || !req.superstatic.path) {
    // req.superstatic = req.superstatic || {}:
    // req.superstatic.path = 'jobs.html';
    console.log('Not Found:', req.url);
    res.writeHead(404);
    return res.end();
  }
  
  next();
};

SsRouter.prototype.removeTrailingSlash = function (req, res, next) {
  if (req.url !== '/' && req.url.substr(-1) === '/') {
    var redirectUrl = req.url.substring(0, req.url.length - 1)
    res.writeHead(301, {Location: redirectUrl});
    return res.end();
  }
  
  next();
};

SsRouter.prototype.forceTrailingSlash = function (req, res, next) {
  if (req.url.substr(-1) !== '/' && mime.lookup(req.url) === 'application/octet-stream') {
    res.writeHead(301, { Location: req.url + '/' });
    return res.end();
  }
  
  next();
};

module.exports = SsRouter;