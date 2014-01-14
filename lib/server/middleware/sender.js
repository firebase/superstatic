var path = require('path');

module.exports = function () {
  return function (req, res, next) {
    res.send = function (pathname) {
      var fileStream = req.ss.store.get(req.workingPathname(pathname));
      
      res.setHeader('Content-Type', fileStream.type);
      fileStream
        .on('error', function (err) {
          
          // TODO: custom 500 page
          
          res.writeHead(500, {'Content-Type': 'text/html'});
          res.end('Error: ' + err.message);
        })
        .pipe(res);
    }
    
    next();
  };
};