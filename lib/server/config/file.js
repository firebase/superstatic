var util = require('util');
var path = require('path');
var fs = require('fs');
var file = require('file');
var Config = require('./base');

var ConfigFile = function (options) {
  Config.apply(this, arguments);
  
  this.configuration = {};
  this.file = options.file || 'superstatic.json';
  this.cwd = options.cwd;
  
  this.configure();
};

util.inherits(ConfigFile, Config);

ConfigFile.prototype.loadConfigurationFile = function () {
  var configFilePath = path.join(this.cwd, this.file);
  var config = {};
  
  try {
    delete require.cache[configFilePath];
    config = require(configFilePath);
  }
  catch (e) {
    config = {};
  }
  finally{
    return config;
  }
};

ConfigFile.prototype.loadFileList = function (config, callback) {
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

ConfigFile.prototype.configure = function () {
  var configFile = this.loadConfigurationFile();
  var config = this.configuration = configFile;
  
  config.root = config.root || './';
  config.files = this.loadFileList(config);
};

ConfigFile.prototype.getAppInfo = function (key, callback) {
  this.configuration.cwd = this.cwd;
  callback(null, this.configuration);
};

module.exports = ConfigFile;