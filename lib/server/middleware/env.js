var _ = require('lodash');

var env = function (settings, localEnv) {
  return function (req, res, next) {
    var match = req.url.match(/\/__\/env(.json|.js)/);
    if (!match) return next();
    
    var envConfig = _.merge(env.envConfig(settings).env || {}, localEnv || {});;
    var payload;
    var payloadType;

    if (match[1] == '.json') {
      payload = JSON.stringify(envConfig);
      payloadType = 'application/json';
    }
    else {
      payload = 'this.__env = ' + JSON.stringify(envConfig) + ';';
      payloadType = 'text/javascript';
    }
    
    res.writeHead(200, {
      'Content-Type': payloadType,
      'Content-Length': payload.length
    });
    
    res.end(payload)
  };
};

env.envConfig = function (settings) {
  return ((settings.build && settings.build.env)
    ? settings.build.env.config
    : undefined) || {};
};

module.exports = env;