var _ = require('lodash');
var Qmap = require('qmap');

module.exports = function services (_services, SERVICE_PREFIX_ROUTE) {
  return function (req, res, next) {
    
    // Set up services queue
    // TODO: this should be set outside each request, on server start
    var qmap = new Qmap();
    _.each(_services, function (fn, name) {
      qmap.method(name, fn);
    });
    
    // Data to be passed to each service
    req.service = {
      list: [],
      prefixPath: SERVICE_PREFIX_ROUTE
    };
    
    // Set up service queue
    _(appServices(req))
      .filter(isService)
      .each(function (name) {
        req.service.list.push(name);
        req.service.config = req.config.services[name];
        qmap.push(name);
      });
    
    // Run each service
    qmap.drain(req, res, next);
  };
  
  function appServices (req) {
    return Object.keys(req.config.services);
  }
  
  function isService (name) {
    return _services.hasOwnProperty(name); 
  }
};
