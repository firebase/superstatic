var util = require('util');
var path = require('path');
var fs = require('fs');
var streamDir = require('stream-dir');
var SsConfig = require('./ss_config');

var SsConfigFile = function (options) {
  this.file = options.file || 'divshot.json';
  
  SsConfig.apply(this, arguments)
};

util.inherits(SsConfigFile, SsConfig);

SsConfigFile.prototype.loadConfigurationFile = function (callback) {
  var configFilePath = path.join(this.cwd, this.file);
  try {
    var config = require(configFilePath);
    callback(null, config);
  }
  catch (e) {
    callback(e);
  }
};

SsConfigFile.prototype.loadFileList = function (callback) {
  var fileList = [];
  var self = this;
  
  streamDir(this.cwd)
    .on('data', function (filePath) {
      fileList.push(filePath.replace(self.cwd, ''));
    })
    .on('error', function (err) {
      callback(err);
    })
    .on('end', function () {
      callback(null, fileList);
    });
};

SsConfig.prototype.resolvePath = function (originalPath, callback) {
  var self = this;
  var filePath = this.getErrorPage();
  
  if (this.isRoute(originalPath)) {
    filePath = this.get('routes')[originalPath];
  }
  
  callback(null, filePath);
};

SsConfigFile.prototype.loadConfiguration = function (callback) {
  var self = this;
  
  this.loadConfigurationFile(function (err, file) {
    self.loadFileList(function (err, fileList) {
      var config = self.configuration = file;
      config.routes = self.configuration.routes || {};
      config.files = fileList;
      
      config.files.forEach(function (file) {
        if (config.clean_urls && path.extname(file) === '.html') {
          config.routes[path.dirname(file) + path.basename(file, '.html')] = file;
        }
        config.routes[file] = file;
      });
      
      callback(null, config);
    });
  });
};


module.exports = SsConfigFile;