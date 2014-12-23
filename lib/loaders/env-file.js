var _ = require('lodash');
var join = require('join-path');

module.exports = function (filename) {
  
  var env = filename || {};
  
  if (_.isString(filename)) {
    
    try {
      env = require(join(process.cwd(), filename));
    }
    catch (e) {}
  }
  
  return env;
};