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

ConfigRedis.prototype.getAppInfo = function (key, callback) {
  var self = this;
  
  this.client.get(key, function (err, buildId) {
    self.client.get(buildId, function (err, buildData) {
      var config = JSON.parse(buildData);
      config.root = config.root || './';
      
      callback(err, config);
    });
  });
};

module.exports = ConfigRedis;