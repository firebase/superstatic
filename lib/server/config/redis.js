var url = require('url');
var URI = require('URIjs');
var http = require('http');
var https = require('https');

var ConfigRedis = function (options) {
  this.cwd = '/';
  this.url = options.url;
  this.client = options.client;
};

ConfigRedis.prototype.load = function (hostname, callback) {
  this.getBuild(hostname, function (err, build) {
    if (err) return callback(err);
    
    callback(err, build);
  });
};

ConfigRedis.prototype.getBuild = function (hostname, callback) {
  var self = this;
  this.getBuildId(hostname, function (err, buildId) {
    if (err) return callback(err);
    
    self.client.get(buildId, function (err, buildData) {
      
      // Oops, we don't have the build data
      if (!buildData) {
        return self.constructBuildObject(hostname, function (err, buildId) {
          self.getBuild(hostname, callback);
        });
      }
      
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
    if (err) return callback(err);
    
    self.client.set(hostname, buildData.id, function (err, status) {
      
      // Don't save the root, no need for it once it's up on divshot.io
      buildData.config.root = './';
      
      self.client.set(buildData.id, JSON.stringify(buildData), function (err, status) {
        callback(err, buildData.id);
      });
    });
    
  });
};

ConfigRedis.prototype.getRawBuild = function (hostname, callback) {
  var url = process.env.API_HOST + '/builds/lookup?host=' + hostname;
  var protocol = url.match(/^https/) ? https : http;
  protocol.get(process.env.API_HOST + '/builds/lookup?host=' + hostname, function (res) {
    if (res.statusCode == 404) return callback('NOT_FOUND');
    
    var data = '';
    
    res.on('data', function (chunk) {
      data += chunk.toString();
    }).on('end', function () {
      callback(null, JSON.parse(data));
    });
  });
};

module.exports = ConfigRedis;