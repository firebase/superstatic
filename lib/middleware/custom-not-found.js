var setCacheHeader = require('cache-header');
var setHeaders = require('./set-headers');

module.exports = function (config) {
  config = config || {};

  return function (req, res, next) {
    setHeaders(config.headers)({url: config.error_page}, res, function() {
      res
        .__.sendFile(config.error_page)
        .on('headers', function () {
          res.__.status(404);
        }).on('error', function (err) {
          next();
        });
    });
  };
};
