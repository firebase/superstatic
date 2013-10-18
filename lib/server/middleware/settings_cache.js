var settingsCache = function (req, res, next) {
  // TODO: no need to call this
  // only call getAppInfo
  req.ss.settings.cache(req, function (err) {
    if (err) {
      res.notFound = true;
    }
    
    req.ss.settings.getAppInfo(req.headers.host, function (err, config) {
      req.ss.config = config;
      
      next();
    });
  });
};

module.exports = settingsCache;

