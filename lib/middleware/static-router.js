var _ = require('lodash');
var slasher = require('glob-slasher');
var globject = require('globject');
var url = require('fast-url-parser');
var flattenToObject = require('flatten-to-object');

module.exports = function (imports) {
  
  var routeDefinitions = flattenToObject(imports.routes);
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