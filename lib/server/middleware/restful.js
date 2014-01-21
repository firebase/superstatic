var url = require('url');
var async = require('async');

module.exports = function (_routes) {
  
  return function (req, res, next) {
    var pathname = url.parse(req.url).pathname;
    var routes = _routes.filter(function (route) {
      return route.path === pathname && req.method === route.method;
    });
    if (!routes.length) return next();
    
    var route = routes[0];
    var responseQueue = async.queue(function (task, callback) {
      task.handler(req, res, function (statusCode, msg) {
        if (statusCode) {
          res.writeHead(statusCode, msg);
          return res.end();
        }
        
        callback();
      });
    });
    
    // Set up the pre route validations
    if (route.validate) {
      Object.keys(route.validate).forEach(function (validateKey) {
        responseQueue.push({name: validateKey, handler: route.validate[validateKey]});
      });
    }
    
    // All done
    responseQueue.drain = function () {
      route.handler(req, res);
    };
  };
};