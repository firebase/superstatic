var fs = require('fs');

var _ = require('lodash');
var join = require('join-path');
var clearRequire = require('clear-require');
var jfig = require('jfig');

var CONFIG_FILE = 'superstatic.json';

module.exports = function (filename) {
  
  filename = filename || CONFIG_FILE;
  var configObject = {};
  // var config = {};
  
  // From custom config data passed in
  try {
    configObject = JSON.parse(filename);
  }
  catch (e) {
    if (_.isObject(filename) && !Array.isArray(filename)) {
      configObject = filename;
    }
  }
  
  if (Array.isArray(filename)) {
    filename = _.find(filename, function (name) {
      
      return fs.existsSync(join(process.cwd(), name));
    });
  }
  
  // Set back to default config file if stringified object is 
  // given as config. With this, we override values in the config file
  if (_.isObject(filename)  && !Array.isArray(filename)) {
    filename = CONFIG_FILE;
  }
  
  var config = jfig(filename, {
    root: process.cwd()
  });
  
  // Passing an object as the config value merges
  // the config data
  return _.extend(config, configObject);
};