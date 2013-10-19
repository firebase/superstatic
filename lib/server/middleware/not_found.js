var path = require('path');
var fs = require('fs');
var url = require('url');
var request = require('hyperquest');

var notFound = function (req, res, next) {
  if (!req.superstatic || !req.superstatic.path) {
    var store = req.ss.store;
    
    // var customPage = req.ssRouter.settings.configuration.error_page;
    var customPage = req.ss.config.error_page;
    return internals.serveFile(res, customPage, store);
  }
  
  next();
};

var internals = {
  serveFile: function (res, customPage, store) {
    var serverFile = customPage || path.resolve(__dirname, '../templates/not_found.html');
    var serveMethod = (customPage && url.parse(customPage).hostname)
      ? request
      : store;
    
    res.writeHead(404, {'Content-Type': 'text/html'});
    return serveMethod.get(serverFile).pipe(res);
  },
};

notFound.internals = internals;
module.exports = notFound;