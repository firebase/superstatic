module.exports = {
  cache: function (done) {
    done()
  },
  cwd: process.cwd(),
  configuration: {
    root: './',
    clean_urls: true,
    routes: {
      'custom-route': 'about.html',
      'app**': 'index.html',
      'app/**': 'index.html',
      'app/test/**': 'index.html',
      'app/test**': 'index.html'
    },
    files: [
      '/index.html',
      '/about.html',
      '/assets/app.js',
      '/contact/index.html',
      '/app/index.html',
      '/app/css/style.css',
      '/app/js/app.js'
    ]
  }
};

