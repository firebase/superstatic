var fs = require('fs');

var _ = require('lodash');
var join = require('join-path');
var clearRequire = require('clear-require');

// TODO: this shouldn't be in this file. It should just
// return an empty object if filename is undefined
var CONFIG_FILE = ['superstatic.json', 'divshot.json'];

module.exports = function (filename) {
  
  filename = filename || CONFIG_FILE;
  var configObject = {};
  var config = {};
  
  // From custom config data passed in
  try {
    configObject = JSON.parse(filename);
  }
  catch (e) {
    if (_.isObject(filename) && !_.isArray(filename)) {
      configObject = filename
    }
  }
  
  // Load file
  config = loadFile(filename);
  
  // Attempt to load default files if no config found
  if (_.isObject(filename) && !_.isArray(filename)) {
    config = loadFile(CONFIG_FILE);
  }
  
  // Passing an object as the config value merges
  // the config data
  return _.extend(config, configObject);
};

function loadFile (filename) {
  
  var config = {};
  
  // Load file
  try {
    
    // Handle config file name
    if (_.isString(filename)) {
      clearRequire(join(process.cwd(), filename));
      config = require(join(process.cwd(), filename));
    }
    
    // Handle array of config file names as strings
    if (_.isArray(filename)) {
      
      filename = _.find(filename, function (name) {
        
        return _.isString(name) && fs.existsSync(join(process.cwd(), name));
      });
      
      if (filename) {
        clearRequire(join(process.cwd(), filename));
        config = require(join(process.cwd(), filename));
      }
    }
  }
  catch (e) {}
  
  return config;
}