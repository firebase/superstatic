var util = require('util');
var path = require('path');
var fs = require('fs');
var file = require('file');
var _ = require('lodash');
var minimatch = require('minimatch');

var ConfigFile = function (options) {
  this._configFileNames = ['superstatic.json', 'divshot.json'];
  this._blacklist = ['**/.git/**', '**/.git**'];
  
  this.configuration = {};
  this.cwd = options.cwd;
  
  if (options.file) this._configFileNames.unshift(options.file);
  
  this.configure();
};

ConfigFile.prototype.loadConfigurationFile = function () {
  var config = {};
  var self = this;
  var configFileName = this.getConfigFileName();
  
  try {
    delete require.cache[configFileName];
    config = require(configFileName);
  }
  catch (e) {
    config = {};
  }
  finally{
    return config;
  }
};

ConfigFile.prototype.getConfigFileName = function () {
  var self = this;
  var configFileName;
  
  this._configFileNames.forEach(function (fileName) {
    var configFilePath = path.join(self.cwd, fileName);
    if (fs.existsSync(configFilePath) && !configFileName) {
      configFileName = configFilePath;
    }
  });
  
  return configFileName
};

ConfigFile.prototype.loadFileList = function (config) {
  var fileList = [];
  var self = this;
  
  function onDirectory (dirPath, dirs, files) {
    if (self.pathIsBlacklisted(dirPath)) return;
    
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

ConfigFile.prototype.pathIsBlacklisted = function (filePath) {
  var blacklisted = _.find(this._blacklist, function (glob) {
    return minimatch(filePath, glob);
  });
  
  return blacklisted;
};

ConfigFile.prototype.configure = function () {
  var configFile = this.loadConfigurationFile();
  var config = this.configuration = configFile;
  
  config.root = config.root || './';
  config.files = this.loadFileList(config);
};

ConfigFile.prototype.load = function (key, callback) {
  this.configuration.cwd = this.cwd;
  this.configuration.config = {
    name: this.configuration.name,
    clean_urls: this.configuration.clean_urls
  };
  
  callback(null, this.configuration);
};

module.exports = ConfigFile;