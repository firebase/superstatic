var slasher = require('glob-slasher');
var globject = require('globject');
var url = require('fast-url-parser');

module.exports = function (imports) {
  
  var routeDefinitions = imports.routes || {};
  var routes = globject(slasher(routeDefinitions));
  
  return function (req, res, next) {
    
    var pathname = url.parse(req.url).pathname;
    var filepath = routes(slasher(pathname));
    
    if (!filepath) {
      return next();
    }
    
    res.__.sendFile(filepath)
      .on('error', function () {
        
        next();
      });
  };
};