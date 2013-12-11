var SuperstaticServer = require('./server/superstatic_server');
var ignore = require('./ignore');

exports.Server = SuperstaticServer;
exports.ignore = ignore;

process.on('uncaughtException', function (err) {
  console.log(err);
  process.exit(1);
});