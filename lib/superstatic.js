var Hapi = require('hapi');
var SsConfigFile = require('./config/ss_config_file');
var SsStoreLocal = require('./store/ss_store_local');

var Superstatic = function (options) {
  this._server = options.server;
  this._port = options.port;
  this._host = options.host;
  this.settings = options.settings;
  this.store = options.store;
};

Superstatic.createServer = function (serverOptions) {
  var settings;
  var store;
  
  if (serverOptions.settings.type === 'file') {
    settings = new SsConfigFile(serverOptions.settings.options);
  }
  
  if (serverOptions.store.type === 'local') {
    store = new SsStoreLocal(serverOptions.store.options);
  }
  
  var server = new Superstatic({
    settings: settings,
    store: store,
    port: serverOptions.port,
    host: serverOptions.host,
  });
  
  return server;
};

Superstatic.prototype._createServer = function () {
  return this._server = this._server || new Hapi.Server(this._host, this._port);
};

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
            self.settings.resolvePath(request.path, function (err, filePath) {
              next(filePath);
            });
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

Superstatic.prototype.start = function (callback) {
  this._createServer();
  this._createRoutes();
  this._server.start(function (err) {
    callback(err);
  });
};

module.exports = Superstatic;