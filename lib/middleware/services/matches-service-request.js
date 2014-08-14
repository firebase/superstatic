var _  = require('lodash');
var path = require('path');
var async = require('async');
var parseServiceRequest = require('./parse-service-request');

module.exports = function (req, availableServices, doneMatching, prefix) {
  prefix = prefix || '__';
  
  async.filter(Object.keys(availableServices), function (name, doneFiltering) {
    var service = availableServices[name];
    var serviceData = parseServiceRequest(req);
    
    if (!service) return doneFiltering();
    
    async.parallel({
      matchesServiceComparator: function (cb) {
        if (typeof service.matchesRequest !== 'function') return cb();
        service.matchesRequest(req, _.partial(cb, null));
      },
      matchesGeneralComparator: function (cb) {
        cb(null, matchesServicePrefix(req, prefix) && name === serviceData.name);
      }
    }, function (err, comparators) {
      doneFiltering(comparators.matchesServiceComparator || comparators.matchesGeneralComparator);
    });
  }, function (serviceNames) {
    doneMatching(null, _.pick(availableServices, serviceNames));
  });
};

function matchesServicePrefix (req, prefix) {
  return req.url.indexOf(path.join('/' + prefix)) === 0;
}