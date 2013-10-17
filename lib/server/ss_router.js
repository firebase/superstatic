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
};

SsRouter.prototype._buildRelativePath = function (filePath) {
  return path.join('/', this.settings.configuration.root, filePath);
  
};

SsRouter.prototype.customRoute = function (req, res, next) {
  if (req.superstatic && req.superstatic.path) return next();
  
  var customRoute = this.isCustomRoute(req.url);
  
  if (!customRoute) return next();
  
  req.superstatic = req.superstatic || {};
  req.superstatic.path =  this._buildFilePath(customRoute);
  
  next();
};

module.exports = SsRouter;