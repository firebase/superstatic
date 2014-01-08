var path = require('path');
var qs = require('querystring');

module.exports = function () {
  return function (req, res, next) {
    // TODO: handle if this is the index file

    var pathname = req.ss.pathname;
    var filePath = path.join('/', req.ss.config.root, pathname + '.html');

    if (!req.ss.config.clean_urls || pathname === '/') return next();
    if (req.ss.isHtml(pathname)) return redirectAsCleanUrl(res, pathname, req.query)
    if (!isCleanUrl(req, pathname)) return next();

    res.send(filePath);

    function isCleanUrl (req, pathname) {
      return req.ss.settings.isFile(req.ss.rootPathname(pathname) + '.html');
    }

    function redirectAsCleanUrl (res, pathname, query) {
      var query = qs.stringify(query);
      
      var redirectUrl = (isDirectoryIndexFile(pathname, 'index.html'))
        ? path.dirname(pathname)
        : path.join('/', path.dirname(pathname), path.basename(pathname, '.html'))
      
      redirectUrl += (query) ? '?' + query : '';
      res.writeHead(301, { Location: redirectUrl });
      res.end();
    }
    
    function isDirectoryIndexFile (pathname, index) {
      return (pathname.split('/')[pathname.split('/').length - 1]) === index;
    }
  };
};