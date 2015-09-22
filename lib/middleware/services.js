/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var _ = require('lodash');
var async = require('async');
var caseless = require('caseless');

var URL_SEGMENT_REGEX = /\/\_\_\/([a-zA-Z0-9\-]+)\/*/i;
var PREFIXLESS_URL_REGEX = /\/\_\_(\/[a-zA-Z0-9\-]+\/*\S*)/i;

module.exports = function (spec) {
  
  spec = spec || {};

  var services = spec.services || {};
  var config = spec.config || {};
 
  return function (req, res, next) {
    
    // Match according to url
    var s = _(services)
      .map(function (fn, name) {
        
        if (matches(fn, name)) {
          return {
            name: name,
            fn: fn
          };
        }
      })
      .filter(_.identity)
      .value();
    
    function matches (fn, name) {
      
      return (caseless(config).has(name) && (urlMatchesName(req.url, name)))
        || (typeof fn.matches === 'function' && fn.matches(req));
    }
    
    // No service matches, move on
    if (_.isEmpty(s)) {
      return next();
    }
    
    // Track service footprint
    var serviceOnReq = false;
    
    // Run each service
    async.eachSeries(s, function (service, serviceDone) {
      
      // Set up service config info
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