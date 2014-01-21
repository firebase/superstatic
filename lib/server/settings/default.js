var path = require('path');
var mix = require('mix-into');

module.exports = mix({
  configuration: {
    root: './'
  },
  load: function (key, callback) {
    callback(null, {});
  },
  isFile: function () {
    return true;
  },
  rootPathname: function (pathname) {
    return path.join('/', './', pathname);
  },
  workingPathname: function (pathname) {
    return path.join('/', pathname || '');
  }
});