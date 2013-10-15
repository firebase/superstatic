var Hapi = require('hapi');

var Superstatic = function (options) {
  this._server = options.server;
  this._port = options.port;
  this._host = options.host;
  
  // TODO: throw error if these don't exist
  this.config = options.config;
  this.store = options.store;
};

Superstatic.prototype._createServer = function () {
  return this._server = this._server || new Hapi.Server(this._host, this._port);
};

// Superstatic.prototype._streamFileWithType = function (filePath) {
//   var file = self.store.createReadStream('index.html');
//   file.type = self.store.getMimeType('index.html');
//   return file;
// };

Superstatic.prototype._createRoutes = function () {
  var self = this;
  
  this._server.route({
    method: 'GET',
    path: '/{p*}',
    config: {
      pre: [
        {
          assign: 'filePath',
          method: function (request, next) {
            var filePath = self.config.resolvePath(request.path);
            next(filePath);
          }
        },
        {
          assign: 'file',
          method: function (request, next) {
            var file = self.store.createReadStream(request.pre.filePath);
            next(file);
          }
        }
      ],
      handler: function (request, reply) {
        reply(request.pre.file)
          .hold()
          .type(request.pre.file.type)
          .send();
      }
    }
  });
};

Superstatic.prototype._startServer = function (callback) {
  this._createServer();
  this._createRoutes();
  this._server.start(function (err) {
    callback(err);
  });
};

Superstatic.prototype.start = function (callback) {
  var self = this;
  
  this.config.loadConfiguration(function (err, config) {
    self._startServer(function (err) {
      callback(err);
    });
  });
};

module.exports = Superstatic;



/*
exports.battleshipSettings = function (inject) {
  var _ = inject('lodash');
  var defaults = {
    baseFile: '/index.html',
    files: [],
    release_data: new Date()
  };
  
  function Settings (options) {
    _.defaults(this, options, defaults);
  }
  
  Settings.prototype._pathIsFile = function (filePath) {
    return this.files.indexOf(filePath + '.html') > -1;
  };
  
  Settings.prototype._pathIsStatic = function (filePath) {
    return this.files.indexOf(filePath) > -1;
  };
  
  Settings.prototype.resolvePath = function (filePath) {
    var filePathToServe =  this.baseFile;
    
    // Route resolves to html file
    if (this._pathIsFile(filePath)) {
      filePathToServe = this.files[this.files.indexOf(filePath + '.html')];
    }
    
    // Route resolves to static asset
    if (this._pathIsStatic(filePath)) {
      filePathToServe = filePath;
    }
    
    return filePathToServe;
  };
  
  return Settings;
};
 */