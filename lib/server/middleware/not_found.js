var path = require('path');
var fs = require('fs');
var isUrl = require('is-url');

var notFound = function () {
  return function (req, res, next) {
    res.statusCode = 404;
    res.send(getErrorPage(req), true);
  };
};

function getErrorPage (req) {
  return (pathExists(req))
    ? pathWithRoot(req)
    : path.resolve(__dirname, '../templates/not_found.html');
}

function pathExists (req) {
  if (!req.config || !req.config.error_page) return false;
  if (isUrl(req.config.error_page)) return true;
  
  // NOTE: If this becomes a bottleneck, convert 
  // to async version of fs.exists()
  return fs.existsSync(pathWithRoot(req));
}

function pathWithRoot (req) {
  if (isUrl(req.config.error_page)) return req.config.error_page;
  return path.resolve(req.config.root, req.config.error_page);
}

module.exports = notFound;