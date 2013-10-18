var settingsCache = function (req, res, next) {
  req.ss.settings.getAppInfo(req.headers.host, function (err, config) {
    req.ss.config = config;
    
    next();
  });
};

module.exports = settingsCache;

