var url = require('url');

var settingsCache = function (req, res, next) {
  req.ss.settings.load(internals.parseHostname(req), function (err, config) {
    if (err) return next();
    req.ss.config = config;
    next();
  });
};

var internals = {
  parseHostname: function (req) {
    var protocol = (req.connection.encrypted) ? 'https://' : 'http://';
    var urlObj = url.parse(protocol + req.headers.host);
    return urlObj.hostname;
  }
};

settingsCache.internals = internals;
module.exports = settingsCache;

