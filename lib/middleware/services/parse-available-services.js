var _ = require('lodash');
var parseServiceRequest = require('./parse-service-request');
var caseless = require('caseless');

module.exports = function (req, services) {
  return _(services)
    .map(function (fn, name) {
      if (isConfigured(req, name, services)) return [name, fn];
    })
    .filter(_.identity)
    .zipObject()
    .value();
};

function isConfigured (req, name, services) {
  var service = parseServiceRequest(req);
  
  name = name || service.name;
  
  return req.config
    && !!caseless(req.config).has(name)
    && !!caseless(services).has(name);
}