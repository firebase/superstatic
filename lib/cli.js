var path = require('path');
var Superstatic = require('./server/ss_server');
var package = require('../package');
var colors = require('colors');
var gaze = require('gaze');

var createInstance = function (awd, host, port) {
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

var start = function (staticServer, callback) {
  callback = callback || function() {};
  
  staticServer.start(function (err) {
    console.log('');
    console.log('superstatic started'.blue);
    console.log('--------------------');
    console.log('Host:', staticServer._host);
    console.log('Port:', staticServer._port);
    callback();
  });
};

var stop = function (staticServer, callback) {
  callback = callback || function() {};
  
  staticServer.stop(callback);
};

var restart = exports.restart = function (staticServer, callback) {
  callback = callback || function() {};
  console.log('Restarting server...'.yellow);
  
  stop(staticServer, function () {
    start(staticServer, callback);
  });
};

var watch = function (staticServer, filesToWatch, callback) {
  callback = callback || function() {};
  
  gaze(filesToWatch, function (err, watcher) {
    var self = this;
    
    start(staticServer, function () {
      
      self.on('all', function (event, filePath) {
        console.log('\n\n');
        console.log(event.green + ': ' + filePath);
        
        restart(staticServer);
      });
      
    });
    
  });
};


var cli = module.exports = function (awd, host, port) {
  console.log('server');
  var server = createInstance(awd, host, port);
  start(server);
};


// start(server(process.cwd(), '127.0.0.1', 3747), function () {
//   console.log('started');
// });
