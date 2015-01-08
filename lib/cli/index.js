var nash = require('nash');

var server = require('../server');

var PORT = 3474;
var HOSTNAME = 'localhost';
var CONFIG_FILENAME = ['superstatic.json', 'divshot.json'];
var DEBUG = false;

module.exports = function () {
  
  var cli = module.exports = nash();

  // Defaults
  cli.set('port', PORT);
  cli.set('hostname', HOSTNAME);
  cli.set('config', CONFIG_FILENAME);
  cli.set('debug', DEBUG);

  // Register cli plugins
  cli.register(require('./flags'));
  cli.register(require('./commands'), {
    server: server
  });

  return cli;
};