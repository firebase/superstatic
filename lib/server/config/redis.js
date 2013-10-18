var url = require('url');
var redis = require('redis');
var SsConfig = require('./base');
var URI = require('urijs');

var ConfigRedis = function (options) {
  this.cwd = '/';
  this.url = options.url;
  this.client = redis.createClient(); // TODO: add connection string
  this.configuration = {};
};

ConfigRedis.prototype.cache = function (req, callback) {
  var self = this;
  
  this.client.get(req.headers.host, function (err, buildId) {
    self.client.get(buildId, function (err, buildData) {
      self.configuration = JSON.parse(buildData);
      self.configuration.root = '';
      
      callback(err);
    });
  });
};

ConfigRedis.prototype.isFile = function (req, filePath, callback) {
  var self = this;
  
  this.getAppInfo(req.headers.host, function (err, config) {
    var isFile = (config.files) ? config.files.indexOf(filePath) > -1 : false;
    console.log(isFile);
    callback(err, isFile);
  });
};

ConfigRedis.prototype.getAppInfo = function (key, callback) {
  var self = this;
  
  this.client.get(key, function (err, buildId) {
    self.client.get(buildId, function (err, buildData) {
      var config = JSON.parse(buildData);
      callback(err, config);
    });
  });
};

module.exports = ConfigRedis;