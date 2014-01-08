var url = require('url');

module.exports = function (req, res, next) {
  req.ss.settings.load(parseHostname(req), function (err, config) {
    if (err) return next();
    req.ss.config = config || {};
    next();
  });
};

var parseHostname = function (req) {
  var protocol = (req.connection.encrypted) ? 'https://' : 'http://';
  var urlObj = url.parse(protocol + req.headers.host);
  return urlObj.hostname;
};
