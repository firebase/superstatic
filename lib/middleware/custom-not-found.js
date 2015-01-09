var setCacheHeader = require('cache-header');

var EXPIRES = 60 * 60 * 24 * 30 * 6; // 6 months(ish)

module.exports = function (imports) {
  
  var config = imports.config || {};
  
  return function (req, res, next) {
    
    res
      .__.sendFile(config.error_page)
      .on('headers', function () {
        
        res.__.status(404);
        setCacheHeader(res, EXPIRES);
      })
      .on('error', function () {
      
        next();
      });
  };
};