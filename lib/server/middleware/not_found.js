var path = require('path');
var fs = require('fs');
var url = require('url');
var request = require('hyperquest');

var notFound = function (req, res, next) {
  if (!req.superstatic || !req.superstatic.path) {
    var store = req.ss.store;
    var customPage = req.ss.config.config.error_page;
    return internals.serveFile(res, customPage, store);
  }
  
  next();
};

var internals = {
  serveFile: function (res, customPage, store) {
    res.writeHead(404, {'Content-Type': 'text/html'});
    
    var serverFile = customPage || path.resolve(__dirname, '../templates/not_found.html');
    var serveMethod = (customPage && url.parse(customPage).hostname)
      ? request.get(serverFile).pipe(res)
      : fs.createReadStream(serverFile).pipe(res);
    
    return;
  }
};

notFound.internals = internals;
module.exports = notFound;