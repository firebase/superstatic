var path = require('path');
var fs = require('fs');
var url = require('url');
var request = require('hyperquest');

var notFound = function (req, res, next) {
  if (!req.superstatic || !req.superstatic.path) {
    var store = req.ss.store;
    var customPage = (req.ss.config && req.ss.config.config.error_page)
      ? req.ss.config.config.error_page
      : path.resolve(__dirname, '../templates/not_found.html');
      
    return internals.serveFile(res, customPage, store);
  }
  
  next();
};

var internals = {
  serveFile: function (res, customPage, store) {
    res.writeHead(404, {'Content-Type': 'text/html'});
    
    var serveMethod = (customPage && url.parse(customPage).host)
      ? request.get(customPage).pipe(res)
      : fs.createReadStream(customPage).pipe(res);
    
    return;
  }
};

notFound.internals = internals;
module.exports = notFound;