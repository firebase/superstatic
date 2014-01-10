var path = require('path');
var fs = require('fs');
var url = require('url');
var request = require('request');
var DEFAULT_ERROR_PAGE = path.resolve(__dirname, '../templates/not_found.html');

var notFound = function () {
  return function (req, res, next) {
    internals.serveFile(res, getErrorPagePath(req), req.ss.store);
  };
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

function getErrorPagePath (req) {
  var page = (hasErrorPagePath(req))
    ? req.config.error_page
    : DEFAULT_ERROR_PAGE;
  
  return page;
}

function hasErrorPagePath (req) {
  return !!(req.config && req.config.error_page && fs.existsSync(req.config.error_page));
}

notFound.internals = internals;
module.exports = notFound;