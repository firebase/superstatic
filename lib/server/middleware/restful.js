module.exports = function () {
  var async = require('async');
  
  return function (req, res, next) {
    var pathName = req._parsedUrl.pathname;
    var routes = req.ss.routes.filter(function (route) {
      return route.path === pathName && req.method === route.method;
    });
    
    if (!routes.length) {
      return next();
    }
    
    var route = routes[0];
    var responseQueue = async.queue(function (task, callback) {
      console.log('running task:', task.name);
      
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
      console.log('running handler');
      route.handler(req, res);
    };
  };
};