var path = require('path');

module.exports = function (url, serviceRoutePrefix) {
  serviceRoutePrefix = serviceRoutePrefix || '__';
  
  var prefix = path.join('/', serviceRoutePrefix);
  var exp = new RegExp('^\\' + prefix);
  return (url.indexOf(prefix) !== 0) ? url : url.replace(exp, '');
};