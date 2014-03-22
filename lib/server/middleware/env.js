var _ = require('lodash');

var env = function (settings, localEnv) {
  return function (req, res, next) {
    var envConfig;
    var payload;
    var match = req.url.match(/\/__\/env(.json|.js)?/);
    
    if (!match) return next()
    
    envConfig = _.merge(env.envConfig(settings).env || {}, localEnv || {});

    if (match[1] == '.json') {
      payload = JSON.stringify(envConfig);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
      });
      res.end(payload);
    }
    else {
      payload = 'this.__env = ' + JSON.stringify(envConfig) + ';';
      res.writeHead(200, {
        'Content-Type': 'text/javascript',
        'Content-Length': payload.length
      });
      res.end(payload)
    }
  };
};

env.envConfig = function (settings) {
  return ((settings.build && settings.build.env)
    ? settings.build.env.config
    : undefined) || {};
};

module.exports = env;