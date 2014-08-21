var _ = require('lodash');
var Van = require('van');
var configureScriptsFromConfig = require('../utils/configure-scripts-from-config');
var format = require('chalk');

// TODO: test
module.exports = function (cli) {
  cli.flag('--prepare')
    .description('run scripts in parallel')
    .exit(true)
    .handler(function (scripts) {
      var scriptsToRun = scripts.split(',');
      scripts = configureScriptsFromConfig(cli.args.args, scriptsToRun);
      
      // warn about undefined scripts
      scriptsToRun.forEach(function (script) {
        if (!scripts[script]) cli.emit('warn', format.bold(script) + ' not defined. Script not run.');
      });
      
      var scriptCommands = _.values(scripts);  
      scriptCommands.push('superstatic ' + parseServerArgs(cli.args.args));
      
      // run scripts
      var van = new Van({
        scripts: scriptCommands
      });
      van.start();
    });
};

function parseServerArgs (args) {
  return _(args)
    .omit('prepare')
    .reduce(function (str, val, flag) {
      return str += (val === true) ? ' --' + flag : ' --' + flag + ' ' + val;
    }, '');
}