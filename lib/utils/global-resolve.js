var glob = require('glob');
var tryRequire = require('try-require');
var join = require('join-path');

var npmPaths = require('./npm-paths');

module.exports = function globalResolve (name) {
  
  var servicePath;
  
  npmPaths()
    .forEach(function (root) {
    
      if (!servicePath) {
        var filepath = glob.sync(join(root, name))[0];
        servicePath = tryRequire(filepath);
      }
    });
  
  return servicePath;
};