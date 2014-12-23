var nash = require('nash');

var PORT = 3474;
var HOSTNAME = 'localhost';
var CONFIG_FILENAME = ['superstatic.json', 'divshot.json'];

module.exports = function () {
  
  var cli = module.exports = nash();

  // Defaults
  cli.set('port', PORT);
  cli.set('hostname', HOSTNAME);
  cli.set('config', ['superstatic.json', 'divshot.json']);

  // Register cli plugins
  cli.register(require('./flags'))
  cli.register(require('./commands'), {
    superstatic: require('../')
  })

  return cli;
};