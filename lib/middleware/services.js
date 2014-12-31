var _ = require('lodash');
var async = require('async');
var caseless = require('caseless');

var URL_SEGMENT_REGEX = /\/\_\_\/([a-zA-Z\-]+)\//i;

module.exports = function (spec) {
  
  spec = spec || {};

  var services = spec.services || {};
  var config = spec.config || {};
 
  return function (req, res, next) {
    
    // No services to run, move on
    if (_.isEmpty(services)) {
      return next();
    }
    
    // Match according to url
    services = _.filter(services, function (fn, name) {
      
      // TODO: this looks complicated, simplify
      return caseless(config).has(name)
        && (urlMatchesName(req.url, name) || (typeof fn.matches === 'function' && fn.matches(req)));
    });
    
    // No service matches, move on
    if (services.length < 1) {
      return next();
    }
    
    // Run each service
    async.eachSeries(services, function (service, serviceDone) {
      
      service(req, res, serviceDone);
    }, function (err) {
      
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