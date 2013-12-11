var qs = require('querystring');

var removeTrailingSlash = function (req, res, next) {
  if (req.ss.pathname !== '/' && req.ss.pathname.substr(-1) === '/') {
    
    var redirectUrl = req.ss.pathname.substring(0, req.ss.pathname.length - 1)
    var query = qs.stringify(req.query);
    
    redirectUrl += (query) ? '?' + query : '';
    res.writeHead(301, {Location: redirectUrl});
    return res.end();
  }
  
  next();
};

module.exports = removeTrailingSlash;