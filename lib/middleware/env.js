var _ = require('lodash');
var fs = require('fs');
var template = fs.readFileSync(__dirname + '/../templates/env.template').toString();

var env = function (settings, localEnv) {
  return function (req, res, next) {
    var match = req.url.match(/\/__\/env(.json|.js)/);
    if (!match) return next();
    
    var envConfig = _.merge(env.envConfig(settings).env || {}, localEnv || {});
    var payload;
    var payloadType;

    // TODO: test this
    // current build/release status data
    if (req.config && req.config.version) {
      envConfig.__release = {
        buildId: req.config.buildId,
        release: req.config.version,
        timestamp: req.config.timestamp
      };
    }

    if (match[1] === '.json') {
      payload = JSON.stringify(envConfig);
      payloadType = 'application/json';
    }
    else {
      payload = template.replace("{{ENV}}", JSON.stringify(envConfig));
      payloadType = 'application/javascript';
    }
    
    res.writeHead(200, {
      'Content-Type': payloadType,
      'Content-Length': payload.length
    });
    
    res.end(payload);
  };
};

env.envConfig = function (settings) {
  return ((settings.build && settings.build.env)
    ? settings.build.env.config
    : undefined) || {};
};

module.exports = env;