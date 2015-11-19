'use strict';

var _ = require('lodash');
var RSVP = require('rsvp');

module.exports = function() {
  var args = _.toArray(arguments);
  return new RSVP.Promise(function(resolve, reject) {
    var userFn = args.pop();

    args.push(function(err, result) {
      return err ? reject(err) : resolve(result);
    });

    var run = userFn.apply(undefined, args);
    if (run.then) {
      run.then(resolve, reject);
    }
  });
};
