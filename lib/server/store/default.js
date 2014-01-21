var path = require('path');
var mix = require('mix-into');

module.exports = mix({
  cwd: './',
  exists: function () {
    return true;
  },
  getPath: function (pathname) {
    return pathname;
  }
});