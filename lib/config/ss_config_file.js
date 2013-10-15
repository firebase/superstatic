var util = require('util');
var path = require('path');
var fs = require('fs');
var streamDir = require('stream-dir');
var SsConfig = require('./ss_config');

var SsConfigFile = function (options) {
  this.file = options.file || 'divshot.json';
  this.cwd = options.cwd || process.cwd();
  
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
  
  streamDir(this.cwd)
    .on('data', function (filePath) {
      fileList.push(filePath.replace(this.cwd, ''));
    })
    .on('error', function (err) {
      callback(err);
    })
    .on('end', function () {
      callback(null, fileList);
    });
};

SsConfigFile.prototype.loadConfiguration = function (callback) {
  var self = this;
  
  this.loadConfigurationFile(this.cwd, function (err, file) {
    self.loadFileList(path.resolve(this.cwd, file.root), function (err, fileList) {
      self.configuration = file;
      self.configuration.files = fileList;
      
      console.log(self.pathIsFile('index'));
      
    });
  });
};


module.exports = SsConfigFile;