var _ = require('lodash');

module.exports = function (req) {
  var parts = _(req.url.split('/'))
    .filter(function (val) {
      return val !== '';
    })
    .tail()
    .value();
  
  return {
    name: parts[0]
  };
};