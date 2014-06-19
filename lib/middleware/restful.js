var url = require('fast-url-parser');
var async = require('async');
var _ = require('lodash');

module.exports = function (_routes, settings) {
  return function (req, res, next) {
    var pathname = url.parse(req.url).pathname;
    var route = _.find(_routes, function (route) {
      return pathname === route.path && req.method.toLowerCase() === route.method.toLowerCase();
    });
    
    if (!route) return next();
    
    var validations = Object.keys(route.validate);
    
    async.each(validations, function (validationName, done) {
      route.validate[validationName](req, res, function (statusCode, message) {
        var err;
        if (statusCode) err = _.zipObject(['statusCode', 'message'], [].slice.call(arguments, 0));
        done(err);
      });
    }, handleRequest);
    
    function handleRequest (err) {
      if (!err) return route.handler(req, res);
      res.writeHead(err.statusCode, err.message);
      res.end();
    }
  };
};