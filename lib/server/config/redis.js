var path = require('path');
var url = require('url');
var http = require('http');
var https = require('https');
var JSUN = require('jsun');

var ConfigRedis = function (options) {
  this.cwd = '/';
  this.url = options.url;
  this.client = options.client;
};

ConfigRedis.prototype.load = function (hostname, callback) {
  var self = this;
  this.getBuild(hostname, function (err, build) {
    if (err) return callback(err);
    
    self.build = build;
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
      
      // TODO: refactor this so that we don't have to manually
      // add these config values to the config object
      var parsed = JSUN.parse(buildData);
      var build = parsed.json;
      build.root = build.config.root || './';
      build.host = hostname;
      build.buildId = buildId;
      build.cwd = buildId;
      build.routes = build.config.routes;
      build.max_age = build.config.max_age;
      
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
  protocol.get(url, function (res) {
    if (res.statusCode == 404) return callback('NOT_FOUND');
    
    var data = '';
    
    res.on('data', function (chunk) {
      data += chunk.toString();
    }).on('end', function () {
      var parsed = JSUN.parse(data);
      callback(parsed.err, parsed.json);
    });
  });
};

ConfigRedis.prototype.isFile = function (filePath) {
  var fullPath = path.join(this.cwd, filePath);
  
  if (!this.build || !this.build.files) return false;
  return this.build.files.indexOf(fullPath) > -1;
};

module.exports = ConfigRedis;