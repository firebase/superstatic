var Van = require('van');
var configureScriptsFromConfig = require('../utils/configure-scripts-from-config');
var _ = require('lodash');

// TODO: test
module.exports = function (cli) {
  cli.flag('--run')
    .description('run script')
    .exit(true)
    .handler(function (script) {
      if (script === true) return cli.error('Script name required');
      
      var scripts = configureScriptsFromConfig(cli.args.args, [script]);
      
      if (!scripts[script]) return cli.error('Script not defined');
      
      var van = new Van({
        scripts: _.pick(scripts, script) // Run single script
      });
      van.start();
    });
};