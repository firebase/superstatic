var setCacheHeader = require('cache-header');

module.exports = function (config) {
  config = config || {};

  return function (req, res, next) {
    res
      .__.sendFile(config.error_page || '/404.html')
      .on('headers', function () {

        res.__.status(404);
      })
      .on('error', function () {

        next();
      });
  };
};
