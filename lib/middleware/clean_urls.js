var path = require('path');
var qs = require('querystring');
var url = require('fast-url-parser');
var fileExists = require('file-exists');
var deliver = require('deliver');

module.exports = function (options) {
  options = options || {};
  
  var root = options.root || '';
  var indexFile = options.index || 'index.html';
  
  return function (req, res, next) {
    var pathname = url.parse(req.url).pathname;
    
    if (pathname === '/') return next();
    if (path.extname(pathname) === '.html') return redirectAsCleanUrl(req, res);
    if (!isCleanUrl(pathname)) return next();
    
    req.url = path.join(root, pathname + '.html');
    
    deliver(req).pipe(res);
  };

  function redirectAsCleanUrl (req, res) {
    var pathname = url.parse(req.url).pathname;
    var query = qs.stringify(req.query);
    
    var redirectUrl = (isDirectoryIndexFile(pathname, indexFile))
      ? path.dirname(pathname)
      : path.join(path.sep, path.dirname(pathname), path.basename(pathname.split('?')[0], '.html'));
    
    redirectUrl += (query) ? '?' + query : '';
    res.writeHead(301, { Location: redirectUrl });
    res.end();
  }

  function isDirectoryIndexFile (pathname, index) {
    var paths = pathname.split('/');
    return (paths[paths.length - 1]) === index;
  }

  function isCleanUrl (pathname) {
    return fileExists(pathname + '.html', {root: root});
  }
};