var qs = require('querystring');
var url = require('url');

var removeTrailingSlash = function () {
  return function (req, res, next) {
    var pathname = url.parse(req.url).pathname;
    
    if (pathname !== '/' && pathname.substr(-1) === '/') {
      
      var redirectUrl = pathname.substring(0, pathname.length - 1)
      var query = qs.stringify(req.query);
      
      redirectUrl += (query) ? '?' + query : '';
      res.writeHead(301, {Location: redirectUrl});
      return res.end();
    }
    
    next();
  };
};

module.exports = removeTrailingSlash;