var path = require('path');
var Superstatic = require('superstatic-server');
var package = require('../package');
var colors = require('colors');

var server = exports.createInstance = function (awd, host, port) {
  return Superstatic.createServer({
    port: port,
    host: host,
    settings: {
      type: 'file',
      options: {
        file: 'divshot.json',
        cwd: awd
      }
    },
    store: {
      type: 'local',
      options: {
        cwd: awd
      }
    }
  });
};

var start = exports.start = function (server, callback) {
  callback = callback || function() {};
  
  server.start(function (err) {
    server.settings.configure(function (err, config) {
      console.log('');
      console.log('superstatic started'.blue);
      console.log('--------------------');
      console.log('Host:', server._host);
      console.log('Port:', server._port);
      callback();
    });
  });
};


var stop = exports.stop = function (server, callback) {
  callback = callback || function() {};
  
  server.stop(callback);
};

var restart = exports.restart = function (server, callback) {
  callback = callback || function() {};
  console.log('Restarting server...'.yellow);
  
  stop(server, function () {
    start(server, callback);
  });
};
