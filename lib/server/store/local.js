var StoreLocal = function (options) {
  this.cwd = options.cwd || process.cwd();
};

StoreLocal.prototype.getPath = function (filePath) {
  return filePath;
};


module.exports = StoreLocal;