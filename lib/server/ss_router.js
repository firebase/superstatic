var path = require('path');

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

SsRouter.prototype._buildFilePath = function (filePath) {
  return path.join(this.settings.cwd, this.settings.configuration.root, filePath || '');
};

SsRouter.prototype._buildRelativePath = function (filePath) {
  return path.join('/', this.settings.configuration.root, filePath);
  
};

module.exports = SsRouter;