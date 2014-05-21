var defaultFileStore = require('./default');

var StoreLocal = function (options) {
  this.cwd = options.cwd || process.cwd();
};

StoreLocal.prototype = defaultFileStore.create();

module.exports = StoreLocal;