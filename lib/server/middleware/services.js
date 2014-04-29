var _ = require('lodash');
var drainer = require('drainer');
var path = require('path');
var async = require('async');

module.exports = function (SERVICES, SERVICE_PREFIX_ROUTE) {
  return function (req, res, next) {
    if (!req.config) return next(); // TODO: test this
    req.config.services = req.config.services || {}; // TODO: test this
    
    var availableServices = {};
    
    // Possible services to run
    _.each(SERVICES, function (fn, name) {
      if (serviceConfigured(req, name)) availableServices[name] = fn;
    });
    
    matchServiceRequest(req, availableServices, function (err, _services) {
      if (err || !_services || _.isEmpty(_services)) return next();
      
      var serviceData = parseServiceRequest(req);
      var serviceModule = SERVICES[serviceData.name];
      var executeServiceStack = drainer(_.values(_services));
      
      // TODO: make this service data different for each
      // service in the stack
      req.service = serviceData;
      req.service.config = parseServiceConfig(req);
      
      executeServiceStack(req, res, next);
    });
  };
  
  function matchServiceRequest (req, availableServices, doneMatching) {
    async.filter(Object.keys(availableServices), function (name, doneFiltering) {
      var service = availableServices[name];
      var serviceData = parseServiceRequest(req);
      
      async.parallel({
        matchesServiceComparator: function (cb) {
          if (typeof service.matchesRequest !== 'function') return cb();
          service.matchesRequest(req, _.partial(cb, null));
        },
        matchesGeneralComparator: function (cb) {
          cb(null, matchesServicePrefix(req) && name === serviceData.name);
        }
      }, function (err, comparators) {
        doneFiltering(comparators.matchesServiceComparator || comparators.matchesGeneralComparator);
      });
    }, function (serviceNames) {
      doneMatching(null, _.pick(availableServices, serviceNames));
    });
  }
  
  function matchesServicePrefix (req) {
    return req.url.indexOf('/' + SERVICE_PREFIX_ROUTE) === 0;
  }
  
  function serviceConfigured (req, name) {
    var service = parseServiceRequest(req);
    
    // TODO: test this
    if (name) service.name = name;
    
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
    
    // TODO: test services that have custom "matchesRequest" methods
    if (!service.name) return {};
    
    return req.config.services[service.name][service.task];
  }
  
  function notEquals (comparator) {
    return function (val) {
      return val !== comparator;
    };
  }
};
