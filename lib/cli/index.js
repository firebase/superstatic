var nash = require('nash');

var PORT = 3474;
var HOSTNAME = 'localhost';
var CONFIG_FILENAME = ['superstatic.json', 'divshot.json'];//, 'package.json'];
var ENV_FILENAME = '.env.json';
var DEBUG = false;

module.exports = function () {
  
  var cli = module.exports = nash();

  // Defaults
  cli.set('port', PORT);
  cli.set('hostname', HOSTNAME);
  cli.set('config', CONFIG_FILENAME);
  cli.set('env', ENV_FILENAME);
  cli.set('debug', DEBUG);

  // Register flags
  cli.register(require('./flags'));
  
  // If no commands matched, the user probably
  // wants to run a server
  cli.register(require('./server'), {
    server: require('../server')
  });

  return cli;
};