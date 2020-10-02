const { denodeify } = require("rsvp");

module.exports = function promiseback(userFn, argCount) {
  // if no callback argument is provided, assume the promise form
  if (userFn.length <= argCount) {
    return userFn;
  }
  // otherwise promise-ify the callback
  return denodeify(userFn);
};
