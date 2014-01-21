var path = require('path');
var mix = require('mix-into');

module.exports = mix({
  configuration: {
    root: './',
    index: 'index.html'
  },
  load: function (key, callback) {
    callback(null, {});
  },
  isFile: function () {
    return true;
  },
  rootPathname: function (pathname) {
    return path.join('/', this.configuration.root, pathname);
  }
});