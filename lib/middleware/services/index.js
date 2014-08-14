var _ = require('lodash');
var stacked = require('stacked');

var prefixless = require('./prefixless');
var parseServiceRequest = require('./parse-service-request');
var matchServiceRequest = require('./matches-service-request');
var parseAvailableServices = require('./parse-available-services');
var track = require('./track');

module.exports = function (options) {
  options = options || {};
  
  var servicesList = options.services || [];
  var serviceRoutePrefix = options.prefix || '__';
  var config = options.config || {};
  
  return function (req, res, next) {
    // Possible services to run
    var services = parseAvailableServices(req, servicesList);
    
    if (_.isEmpty(services)) return next();
    
    matchServiceRequest(req, services, function (err, s) {
      if (_.isEmpty(s)) return next();
      
      var pack = stacked();
      
      _.each(wrapWithConfig(s, track(config, options.track)), function (service) {
        pack.use(service);
      });
      
      pack(req, res, next);
    });
  };
  
  function wrapWithConfig (services, tracker) {
    return _(services)
      .map(function (fn, name) {
        return function (req, res, next) {
          req.service = {
            name: name,
            config: config[name],
            path: prefixless(req.url)
          };
          
          fn(req, res, next);
          
          // TODO: add this back in when we should track this
          
          // tracker.serviceAvailable(name, function (err, available) {
            
          //   // TODO: will uncomment when we get services out of beta
          //   // TODO: test this
          //   // if (!available) {
          //     // send off email to Divshot to notify
          //     // customer of going over limit
          //   // }
            
          //   req.service = {
          //     name: name,
          //     config: config[name],
          //     path: prefixless(req.url)
          //   };
            
          //   fn(req, res, next);
            
          //   tracker.recordUsage(name, req);
          // });
        };
      }).value();
  }
};