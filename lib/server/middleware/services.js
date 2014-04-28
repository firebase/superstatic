var _ = require('lodash');
var Qmap = require('qmap');
var path = require('path');

module.exports = function services (SERVICES, SERVICE_PREFIX_ROUTE) {
  return function (req, res, next) {
    if (!matchesServiceRequest(req) || !serviceConfigured(req)) return next();
    
    // TODO: pass a "matchesRequest" function to service
    // so that service can determine if it should run itself
    
    var serviceData = parseServiceRequest(req);
    var serviceModule = SERVICES[serviceData.name];
    
    req.service = serviceData;
    req.service.config = parseServiceConfig(req);
    
    // TODO: do we need to make the req and res objects immutable?
    // Object.freeze(req);
    
    serviceModule(req, res, next);
  };
  
  function matchesServiceRequest (req) {
    
    // NOTE: we can also pass a method into the service and
    // let the service developer define a "matchesReqeust"
    // function
    
    return req.url.indexOf('/' + SERVICE_PREFIX_ROUTE) === 0;
  }
  
  function serviceConfigured (req) {
    var service = parseServiceRequest(req);
    
    return req.config
      && req.config.services
      && req.config.services.hasOwnProperty(service.name)
      && SERVICES.hasOwnProperty(service.name);
  }
  
  function parseServiceRequest (req) {
    var parts = _(req.url.split('/'))
      .filter(notEquals(''))
      .tail()
      .value();
    
    return {
      name: parts[0],
      task: parts[1],
      path: path.join('/', parts.slice(2).join('/'))
    };
  }
  
  function parseServiceConfig (req) {
    var service = parseServiceRequest(req);
    return req.config.services[service.name][service.task];
  }
  
  function notEquals (comparator) {
    return function (val) {
      return val !== comparator;
    };
  }
};
