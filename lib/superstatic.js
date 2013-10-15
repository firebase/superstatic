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
            self.config.resolvePath(request.path, function (err, filePath) {
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