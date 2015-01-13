var superstatic = require('../../');
var connect = require('connect');

var spec = {
  config: {
    root: './app',
    routes: {
      '**': 'index.html'
    }
  },
  cwd: process.cwd()
};

var app = connect()
  .use(superstatic(spec))

app.listen(3474, function (err) {
  
  console.log('Superstatic now serving on port 3474 ...');
});