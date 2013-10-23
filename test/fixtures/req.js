var sinon = require('sinon');

module.exports = {
  url: '/superstatic.html',
  ss: {
    config: {
      cwd: '/',
      root: './',
      files: [
        '/superstatic.html',
        '/contact/index.html'
      ],
      routes: {
        'custom-route': 'superstatic.html',
        'app**': 'superstatic.html',
        'app/**': 'superstatic.html',
        'app/test/**': 'superstatic.html',
        'app/test**': 'superstatic.html'
      },
      config: {}
    }
  },
  ssRouter: {}
};
