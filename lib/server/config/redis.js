var url = require('url');
// var redis = require('redis');
var URI = require('urijs');
var http = require('http');

var ConfigRedis = function (options) {
  this.cwd = '/';
  this.url = options.url;
  this.client = options.client;
};

ConfigRedis.prototype.load = function (hostname, callback) {
  this.getBuild(hostname, function (err, build) {
    callback(err, build);
  });
};

ConfigRedis.prototype.getBuild = function (hostname, callback) {
  var self = this;
  this.getBuildId(hostname, function (err, buildId) {
    self.client.get(buildId, function (err, buildData) {
      
      var build = JSON.parse(buildData);
      build.root = build.config.root || './';
      build.host = hostname;
      build.buildId = buildId;
      build.cwd = buildId;
      
      callback(err, build);
    });
  });
};

ConfigRedis.prototype.getBuildId = function (hostname, callback) {
  var self = this;
  this.client.get(hostname, function (err, buildId) {
    if (!buildId) return self.constructBuildObject(hostname, callback);
    callback(err, buildId);
  });
};

ConfigRedis.prototype.constructBuildObject = function (hostname, callback) {
  var self = this;
  
  // Get info from API server
  this.getRawBuild(hostname, function (err, buildData) {
    
    // TODO: remove these mock values
    // these should be set by the api
    buildData.root = './';
    buildData.clean_urls = 'true';
    
    // TODO: use Redis transactions
    
    self.client.set(hostname, buildData.id, function (err, status) {
      self.client.set(buildData.id, JSON.stringify(buildData), function (err, status) {
        callback(err, buildData.id);
      });
    });
    
  });
};

ConfigRedis.prototype.getRawBuild = function (hostname, callback) {
  // TODO: put this url somewhere else
  http.get('http://api.dev.divshot.com:9393/builds/lookup?host=' + hostname, function (res) {
    var data = '';
    res.on('data', function (chunk) {
      data += chunk.toString();
    }).on('end', function () {
      callback(null, JSON.parse(data));
    });
  });
};

module.exports = ConfigRedis;