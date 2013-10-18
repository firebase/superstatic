var path = require('path');
var fs = require('fs');
var url = require('url');
var request = require('hyperquest');

var notFound = function (req, res, next) {
  if (!req.superstatic || !req.superstatic.path) {
    var store = req.ssRouter.store;
    
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
      : store.get;
    
    res.writeHead(404, {'Content-Type': 'text/html'});
    return serveMethod(serverFile).pipe(res);
  },
};

notFound.internals = internals;
module.exports = notFound;