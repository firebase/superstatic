var util = require('util');
var path = require('path');
var fs = require('fs');
var file = require('file');
var SsConfig = require('./ss_config');

var SsConfigFile = function (options) {
  SsConfig.apply(this, arguments);
  
  this.file = options.file || 'divshot.json';
  this.cwd = options.cwd;
  
  this.configure();
};

util.inherits(SsConfigFile, SsConfig);

SsConfigFile.prototype.loadConfigurationFile = function () {
  var configFilePath = path.join(this.cwd, this.file);
  var config = {};
  
  try {
    config = require(configFilePath);
  }
  catch (e) {
    config
  }
  finally{
    return config;
  }
};

SsConfigFile.prototype.loadFileList = function (config, callback) {
  var fileList = [];
  var self = this;
  
  function onDirectory (dirPath, dirs, files) {
    files.forEach(function (file) {
      fileList.push(path.join(dirPath, file).replace(self.cwd, ''));
    });
    
    dirs.forEach(function (dir) {
      file.walkSync(path.join(dirPath, dir), onDirectory);
    });
  }
  
  file.walkSync(path.resolve(this.cwd, config.root), onDirectory);
  return fileList;
};

SsConfigFile.prototype.configure = function () {
  var configFile = this.loadConfigurationFile();
  var config = this.configuration = configFile;
  
  config.root = config.root || './';
  config.files = this.loadFileList(config);
};

SsConfigFile.prototype.getErrorPagePath = function () {
  return this.get('error_page') || path.resolve(__dirname, '../error.html');
};

module.exports = SsConfigFile;