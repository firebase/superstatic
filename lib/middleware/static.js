module.exports = function (config) {
  config = config || {};
  return function (req, res, next) {
    res.__.sendFile(req._parsedUrl.pathname)
      .on('headers', function() {
        if (req._parsedUrl.pathname === config.error_page) {
          res.__.status(404);
        }
      }).on('error', function (err) {
        if (err.status) { res.statusCode = err.status; }
        next();
      });
  };
};
