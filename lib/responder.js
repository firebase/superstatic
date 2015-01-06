var path = require('path');

var _ = require('lodash');
var join = require('join-path');
var through = require('through2');
var mime = require('mime-types');
var onHeaders = require('on-headers');
var onFinished = require('on-finished');
var destroy = require('destroy');

module.exports = function (imports) {
  
  var req = imports.req;
  var res = imports.res;
  var provider = imports.provider;
  
  if (!res) {
    throw new TypeError('response object required');
  }
  
  if (!provider) {
    throw new TypeError('provider required');
  }
  
  res.send = send;
  res.sendFile = sendFile;
  res.ext = ext;
  res.status = status;
  res.redirect = redirect;
  
  var customExtensionType = false;
  
  function send (data) {
    
    var contentType = mime.contentType('html');
    
    if (typeof data === 'object') {
      data = JSON.stringify(data);
      contentType = mime.contentType('json');
    }
    
    var len = Buffer.byteLength(data, 'utf8');
    
    onHeaders(res, function () {
      
      // Only set this if we didn't specify a custom extension type
      if (!customExtensionType && !res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', contentType);
      }
      
      res.setHeader('Content-Length', len);
    });
    
    // On next tick so it's chainable
    process.nextTick(function () {
      
      res.end(data);
    });
    
    return res;
  }
  
  function sendFile (pathname) {
    var stream = through();
    var fileStream;
    
    // Adjust pathname for serving a directory index file
    if (provider.isDirectoryIndexSync(pathname) || pathname === '/') {
      pathname = provider.asDirectoryIndex(pathname);
    }
    
    // TODO: this throws an error for trying to get "/" when 
    // there is no index file
    
    provider.exists(pathname, function (exists) {
      
      if (!exists) {
        
        var err = new Error('not found');
        err.status = 404;
        
        // On next tick so it's chainable
        stream.emit('error', err);
      }
      else {
        fileStream = provider.createReadStream(pathname, imports)
          .pipe(stream);
        
        onHeaders(res, function () {
    
          var contentType = mime.contentType(path.extname(pathname));
          
          res.setHeader('Content-Type', contentType);
          
          if (!res.getHeader('Content-Length')) {
            res.setHeader('Content-Length', provider.statSync(pathname).size);
          }
          
          fileStream.emit('headers', res);
        });
        
        // Send file to resposne
        fileStream.pipe(res);
      }
      
      // Handle the end of a response
    });
    
    onFinished(res, function () {
      
      destroy(fileStream);
    });
    
    
    // Extend the stream so response helpers
    // are chainable in any order
    return _.extend(stream, res);
  }
  
  function ext (extension) {
    
    customExtensionType = true;
    
    onHeaders(res, function () {
      
      res.setHeader('Content-Type', mime.contentType(extension));
    });
    
    return res;
  }
  
  function status (code) {
   
    res.statusCode = code;
    return res;
  }
  
  function redirect (location, status) {
    
    status = status || 301;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.writeHead(status, {
      'Location': location
    });
    res.send('Redirecting to ' + location  + ' ...');
  }
  
  return res;
};