var path = require('path');
var fs = require('fs');
var ignore = require('../../ignore');
var defaultSettings = require('./default');

var ConfigFile = function (options) {
  this._configFileNames = ['superstatic.json', 'divshot.json'];
  this.configuration = {};
  this.cwd = options.cwd;
  
  if (options.file) this._configFileNames.unshift(options.file);
  
  this.configure(options.config);
};

defaultSettings.mixInto(ConfigFile.prototype);

ConfigFile.prototype.configure = function (defaultConfig) {
  var configFile = this.loadConfigurationFile(defaultConfig);
  var config = this.configuration = configFile;
  
  config.root = config.root || './';
};

ConfigFile.prototype.loadConfigurationFile = function (defaultConfig) {
  if (defaultConfig) return defaultConfig;
  
  var config = {};
  var configFileName = this.getConfigFileName();
  
  try {
    delete require.cache[configFileName];
    config = require(configFileName);
  }
  catch (e) {}

  return config;
};

ConfigFile.prototype.getConfigFileName = function () {
  var cwd = this.cwd;
  var configFileName;
  
  this._configFileNames.forEach(function (fileName) {
    var configFilePath = path.join(cwd, fileName);
    if (fs.existsSync(configFilePath) && !configFileName) {
      configFileName = configFilePath;
    }
  });
  
  return configFileName
};

ConfigFile.prototype.load = function (key, callback) {
  this.configuration.cwd = this.cwd;
  this.configuration.config = {
    name: this.configuration.name,
    clean_urls: this.configuration.clean_urls
  };
  
  callback(null, this.configuration);
};

ConfigFile.prototype.isFile = function (filePath) {
  var fullPath = path.join(this.cwd, filePath);
  
  if (!fs.existsSync(fullPath)) return false;
  if (!fs.statSync(fullPath).isFile()) return false;
  
  return true;
};

module.exports = ConfigFile;