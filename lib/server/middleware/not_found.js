var path = require('path');
var fs = require('fs');

var notFound = function (req, res, next) {
  if (!req.superstatic || !req.superstatic.path) {
    var filePath = path.resolve(__dirname, '../templates/not_found.html');
    
    res.writeHead(404, {'Content-Type': 'text/html'});
    return fs.createReadStream(filePath).pipe(res);
  }
  
  next();
};

module.exports = notFound;