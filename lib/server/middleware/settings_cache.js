var URI = require('URIjs');
var url = require('url');

var settingsCache = function (req, res, next) {
  
  // Correctly parse our hostname without port
  var protocol = (req.connection.encrypted) ? 'https://' : 'http://';
  var urlObj = url.parse(protocol + req.headers.host);
  var hostname = urlObj.hostname;
  
  // Set our url object for future use
  req.ss.url = urlObj;
  
  req.ss.settings.load(req.ss.url.hostname, function (err, config) {
    console.log(config);
    if (err) return next();
    req.ss.config = config;
    next();
  });
};

module.exports = settingsCache;

