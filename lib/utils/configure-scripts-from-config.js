var _ = require('lodash');
var parseOverrideConfig = require('./parse-override-config');
var tryRequire = require('./try-require');

module.exports = function (args, scriptsToKeep, defaultScripts) {
  var cwd = process.cwd();
  var config = parseOverrideConfig(args);
  
  if (typeof config === 'string') config = tryRequire(cwd + '/' + config) || {};
  if (!config) config = tryRequire(cwd + '/divshot.json') || tryRequire(cwd + '/superstatic.json');
  
  var scripts = _.pick(config.scripts, scriptsToKeep);
  
  return _.extend(defaultScripts || {}, scripts);
};