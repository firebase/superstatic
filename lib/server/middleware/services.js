var _ = require('lodash');
var Qmap = require('qmap');
var path = require('path');

module.exports = function services (SERVICES, SERVICE_PREFIX_ROUTE) {
  return function (req, res, next) {
    if (!matchesServiceRequest(req) || !serviceConfigured(req)) return next();
    
    var serviceData = parseServiceRequest(req);
    var serviceModule = SERVICES[serviceData.name];
    
    req.service = serviceData;
    req.service.config = parseServiceConfig(req);
    
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
      && req.config.hasOwnProperty(service.name)
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
    return req.config[service.name][service.task];
  }
  
  function notEquals (comparator) {
    return function (val) {
      return val !== comparator;
    };
  }
};
