'use strict';

var RSVP = require('rsvp');

module.exports = function(userFn, argCount) {
  // if no callback argument is provided, assume the promise form
  if (userFn.length <= argCount) {
    return userFn;
  }
  // otherwise promise-ify the callback
  return RSVP.denodeify(userFn);
};
