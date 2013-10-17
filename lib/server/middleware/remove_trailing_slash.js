var removeTrailingSlash = function (req, res, next) {
  if (req.url !== '/' && req.url.substr(-1) === '/') {
    var redirectUrl = req.url.substring(0, req.url.length - 1)
    res.writeHead(301, {Location: redirectUrl});
    return res.end();
  }
  
  next();
};

module.exports = removeTrailingSlash;