var setCacheHeader = require('cache-header');

var EXPIRES = 60 * 60 * 24 * 30 * 6; // 6 months(ish)

module.exports = function (imports) {
  
  var config = imports.config || {};
  
  return function (req, res, next) {
    
    res
      .sendFile(config.error_page)
      .status(404)
      .on('headers', function () {
        
        setCacheHeader(res, EXPIRES);
      })
      .on('error', function () {
      
        next();
      });
  };
};