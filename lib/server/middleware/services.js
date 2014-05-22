var _ = require('lodash');
var executeStack = require('drainer');
var path = require('path');
var async = require('async');

module.exports = function (servicesList, serviceRoutePrefix) {
  return function (req, res, next) {
    if (!req.config) return next(); // TODO: test this
    
    // Possible services to run
    var availableServices = _(servicesList)
      .map(function (fn, name) {
        if (serviceConfigured(req, name)) return [name, fn];
      })
      .filter(_.identity)
      .zipObject()
      .value();
    
    console.log('available services: ' + Object.keys(availableServices));
    
    if (_.isEmpty(availableServices)) return next();
    
    matchServiceRequest(req, availableServices, function (err, _services) {
      if (_.isEmpty(_services)) return next();
      executeStack(buildStack(_services))(req, res, next);
    });
  };
  
  function buildStack (services) {
    return _(services)
      .map(function (fn, name) {
        return function (req, res, next) {
          req.service = {
            name: name,
            config: req.config[name],
            path: prefixlessPath(req.url)
          };
          
          console.log(name + ' service activated for url ' + req.url + ' on app ' + req.config.name + ' with values ' + JSON.stringify(req.service));
          
          fn(req, res, next);
        };
      }).value();
  }
  
  function serviceConfigured (req, name) {
    var service = parseServiceRequest(req);
    
    name = name || service.name;
    
    return req.config
      && containsInAnyCase(req.config, name)
      && containsInAnyCase(servicesList, name);
  }
  
  function matchServiceRequest (req, availableServices, doneMatching) {
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
    return req.url.indexOf(path.join('/' + serviceRoutePrefix)) === 0;
  }
  
  function parseServiceRequest (req) {
    var parts = _(req.url.split('/'))
      .filter(notEquals(''))
      .tail()
      .value();
    
    return {
      name: parts[0]
    };
  }
  
  function parseServiceConfig (req) {
    var service = parseServiceRequest(req);
    
    if (!service.name) return {};
    
    return req.config[service.name];
  }
  
  function prefixlessPath (url) {
    var prefix = path.join('/', serviceRoutePrefix);
    var exp = new RegExp('^\\' + prefix);
    return (url.indexOf(prefix) !== 0) ? url : url.replace(exp, '');
  }
  
};

function containsInAnyCase (obj, key, caseSensitive) {
  var keys = _(obj)
    .keys()
    .map(toLowerCase)
    .value();
    
  return _.contains(keys, key) || _.contains(keys, key.toLowerCase());
}

function toLowerCase (val) {
  return val.toLowerCase();
}

function notEquals (comparator) {
  return function (val) {
    return val !== comparator;
  };
}
