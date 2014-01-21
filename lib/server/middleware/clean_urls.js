var path = require('path');
var qs = require('querystring');

module.exports = function (settings, fileStore) {
  return function (req, res, next) {
    var pathname = req.ss.pathname;
    var filePath = path.join('/', req.config.root, pathname + '.html');

    if (!req.config.clean_urls || pathname === '/') return next();
    if (isHtml(pathname)) return redirectAsCleanUrl(req, res)
    if (!isCleanUrl(pathname, fileStore, settings)) return next();

    res.send(filePath);
  };
};

function redirectAsCleanUrl (req, res) {
  var pathname = req.ss.pathname
  var query = qs.stringify(req.query);
  var redirectUrl = (isDirectoryIndexFile(pathname, req.config.index))
    ? path.dirname(pathname)
    : path.join('/', path.dirname(pathname), path.basename(pathname.split('?')[0], '.html'))
  
  redirectUrl += (query) ? '?' + query : '';
  res.writeHead(301, { Location: redirectUrl });
  res.end();
}

function isDirectoryIndexFile (pathname, index) {
  return (pathname.split('/')[pathname.split('/').length - 1]) === index;
}

function isHtml (pathname) {
  return path.extname(pathname.split('?')[0]) === '.html';
}

function isCleanUrl (pathname, fileStore, settings) {
  return fileStore.exists(settings.rootPathname(pathname) + '.html');
}