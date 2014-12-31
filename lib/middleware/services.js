var _ = require('lodash');
var async = require('async');
var caseless = require('caseless');

var URL_SEGMENT_REGEX = /\/\_\_\/([a-zA-Z\-]+)\/*/i;
var PREFIXLESS_URL_REGEX = /\/\_\_(\/[a-zA-Z\-]+\/*\S*)/i;

module.exports = function (spec) {
  
  spec = spec || {};

  var services = spec.services || {};
  var config = spec.config || {};
 
  return function (req, res, next) {
    
    // Match according to url
    services = _(services)
      .map(function (fn, name) {
      
        // TODO: this looks complicated, simplify
        if (caseless(config).has(name)
          && (
            urlMatchesName(req.url, name)
              || (typeof fn.matches === 'function' && fn.matches(req))
          )) {
          
          return {
            name: name,
            fn: fn
          };
        }
      })
      .filter(_.identity)
      .value();
    
    // No service matches, move on
    if (_.isEmpty(services)) {
      return next();
    }
    
    // Track service footprint
    var serviceOnReq = false;
    
    // Run each service
    async.eachSeries(services, function (service, serviceDone) {
      
      serviceOnReq = true;
      req.service = {
        name: service.name,
        config: caseless(config).get(service.name),
        path: req.url.match(PREFIXLESS_URL_REGEX)[1]
      };
      
      service.fn(req, res, serviceDone);
    }, function (err) {
      
      // Remove service footprint
      if (serviceOnReq) {
        req.service = undefined;
      }
      
      next();
    });
  };
};

function urlMatchesName (url, name) {
  
  var segment = url.match(URL_SEGMENT_REGEX);
  
  if (!segment || segment.length < 1) {
    return false;
  }
  
  return segment[1].toLowerCase() === name.toLowerCase();
}