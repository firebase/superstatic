var url = require('url');
var path = require('path');
var http = require('http');
var https = require('https');
var JSUN = require('jsun');
var async = require('async');

var ConfigRedis = function (options) {
  this.cwd = '/';
  this.url = options.url;
  this.client = options.client;
};

ConfigRedis.prototype.load = function (hostname, callback) {
  var self = this;
  
  this.getRelease(hostname, function (err, release) {
    if (err) return callback(err);
    
    // TODO: refactor this so that we don't have to manually
    // add these config values to the config object
    release.id = release.build.id; // this is disgusting
    release.root = release.build.config.root || './';
    release.host = hostname;
    release.buildId = release.build.id;
    release.cwd = release.build.id;
    release.routes = release.build.config.routes;
    release.max_age = release.build.config.max_age;
    release.files = release.build.files;
    release.config = release.build.config;
    
    // QUESTION: do I need to set this on the object?
    // does this get messed up on each request?
    self.build = release;
    callback(err, release);
  });
};

ConfigRedis.prototype.isFile = function (filePath) {
  // TODO: do we provide shared functionality between
  // this class and the file.js version of this class
  filePath = path.join(this.cwd, filePath);
  
  if (!this.build || !this.build.files) return false;
  return this.build.files.indexOf(filePath) > -1;
};

ConfigRedis.prototype.getRelease = function (hostname, callback) {
  var self = this;
  
  async.parallel({
    build: function (cb) {
      self._getCacheKey(hostname, self._hostCacheKey(hostname), function (err, key) {
        self._getBuildCache(key, cb, hostname);
      });
    },
    env: function (cb) {
      self._getCacheKey(hostname, self._envCacheKey(hostname), function (err, key) {
        self._getEnvCache(key, cb, hostname);
      });
    }
  }, callback);
};

ConfigRedis.prototype._getBuildCache = function (key, callback, hostname) {
  var self = this;
  
  this._get(key, function (err, build) {
    if (err) return callback(err);
    if (build) return callback(null, build);
    
    self._getReleaseFromApi(hostname, function (err, release) {
      
      // Don't save the root, no need for it once it's up on divshot.io
      release.build.config.root = './';
      
      self._set(self._buildCacheKey(release), release.build, function (err) {
        self._getBuildCache(key, callback);
      });
    });
  });
};

// TODO: figure out a way not to have to pass the hostname
ConfigRedis.prototype._getEnvCache = function (key, callback, hostname) {
  var self = this;
  
  this._get(key, function (err, env) {
    if (err) return callback(err);
    if (env) return callback(null, env);
    
    self._getReleaseFromApi(hostname, function (err, release) {
      self._set(self._appEnvCacheKey(release), release.env, function (err) {
        self._getEnvCache(key, callback);
      });
    });
  });
};

ConfigRedis.prototype._getCacheKey = function (hostname, hostKey, callback) {
  var self = this;
  
  this._get(hostKey, function (err, key) {
    if (err) return callback(err);
    if (key) return callback(null, key);
    
    self._getReleaseFromApi(hostname, function (err, release) {
      self._set(hostKey, self._buildCacheKey(release), function (err) {
        self._getCacheKey(hostname, hostKey, callback);
      });
    });
  });
};

ConfigRedis.prototype._hostCacheKey = function (hostname) {
  return 'host:' + hostname + ':build';
};

ConfigRedis.prototype._envCacheKey = function (hostname) {
  return 'host:' + hostname + ':env';
};

ConfigRedis.prototype._buildCacheKey = function (release) {
  return 'builds:' + release.build.id;
};

ConfigRedis.prototype._appEnvCacheKey = function (release) {
  var id = release.application_id;
  var env = release.env.name;
  
  return 'apps:' + id + ':' + env;
};

ConfigRedis.prototype._get = function (key, callback) {
  this.client.get(key, function (err, data) {
    if (err) return callback(err);
    
    var parsed = JSUN.parse(data);
    callback(null, parsed.json || data);
  });
};

ConfigRedis.prototype._set = function (key, value, callback) {
  if (typeof value !== 'string') {
    var parsed = JSUN.stringify(value);
    value = parsed.string;
  }
  
  this.client.set(key, value, callback);
};

ConfigRedis.prototype._getReleaseFromApi = function (hostname, callback) {
  var self = this;
  var url = process.env.API_HOST + '/releases/lookup?host=' + hostname;
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

module.exports = ConfigRedis;