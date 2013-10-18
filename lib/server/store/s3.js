var knox = require('knox');


var StoreS3 = function (options) {
  this.cwd = options.cwd || './';
};

SsStoreLocal.prototype.get = function (filePath) {
  
  
  
  // var file = fs.createReadStream(filePath);
  // file.type = mime.lookup(filePath);
  // return file;
};

module.exports = StoreS3;