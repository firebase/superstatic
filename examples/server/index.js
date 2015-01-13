var superstatic = require('../../lib/server');

var spec = {
  port: 3474,
  config: {
    root: './app'
  },
  cwd: __dirname,
  errorPage: __dirname + '/error.html',
  gzip: true,
  debug: true
};

var app = superstatic(spec);
var server = app.listen(function (err) {
  
  console.log('Superstatic now serving on port 3474 ...');
});