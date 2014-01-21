var path = require('path');
var fs = require('fs');
var isUrl = require('is-url');

var notFound = function () {
  return function (req, res, next) {
    res.statusCode = 404;
    res.send(getErrorPage(req.config), true);
  };
};

function getErrorPage (config) {
  return (hasErrorPagePath(config))
    ? config.error_page
    : path.resolve(__dirname, '../templates/not_found.html');
}

function hasErrorPagePath (config) {
  if (!config || !config.error_page) return false;
  if (isUrl(config.error_page)) return true;
  
  return fs.existsSync(config.error_page);
}

module.exports = notFound;