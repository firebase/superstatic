var _ = require('lodash');
var stacked = require('stacked');

var prefixless = require('./prefixless');
var parseServiceRequest = require('./parse-service-request');
var matchServiceRequest = require('./matches-service-request');
var parseAvailableServices = require('./parse-available-services');

// module.exports = function (servicesList, serviceRoutePrefix) {
module.exports = function (options) {
  options = options || {};
  
  var servicesList = options.services || [];
  var serviceRoutePrefix = options.prefix || '__';
  var config = options.config || {};
  
  return function (req, res, next) {
    
    
    // var tracker = options.tracker;
    
    
    // Possible services to run
    var services = parseAvailableServices(req, servicesList);
    
    if (_.isEmpty(services)) return next();
    
    matchServiceRequest(req, services, function (err, s) {
      if (_.isEmpty(s)) return next();
      
      var pack = stacked();
      
      _.each(wrapWithConfig(s), function (service) {
        pack.use(service);
      });
      
      pack(req, res, next);
    });
  };
  
  function wrapWithConfig (services) {
    return _(services)
      .map(function (fn, name) {
        return function (req, res, next) {
          
          // TODO: test for usage here because we've already
          // compared request and determined that we should attempt
          // to run this service
          // 
          // tracker.serviceAvailable('proxy');
          
          req.service = {
            name: name,
            config: config[name],
            path: prefixless(req.url)
          };
          
          fn(req, res, next);
          
          // TODO: track use here
          // tracker.recordUsage(/* data */)
        };
      }).value();
  }
};