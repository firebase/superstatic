/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var fs = require('fs');
var path = require('path');

var _ = require('lodash');
var join = require('join-path');
var through = require('through2');
var mime = require('mime-types');
var onHeaders = require('on-headers');
var onFinished = require('on-finished');
var destroy = require('destroy');

var INDEX_FILE = 'index.html';

module.exports = function (imports) {
  imports.config = imports.config || {};
  var indexFile = imports.config.index || INDEX_FILE;

  var req = imports.req;
  var res = imports.res;
  var provider = imports.provider;

  if (!res) {
    throw new TypeError('response object required');
  }

  if (!provider) {
    throw new TypeError('provider required');
  }

  // Set up helpers on response object
  res.__ = {};
  res.__.send = send;
  res.__.sendFile = sendFile;
  res.__.ext = ext;
  res.__.status = status;
  res.__.redirect = redirect;

  var customExtensionType = false;

  function send (data) {

    var contentType = mime.contentType('html');

    if (typeof data === 'object') {
      data = JSON.stringify(data);
      contentType = mime.contentType('json');
    }

    var len = Buffer.byteLength(data, 'utf8');
    var etag = generateEtag(data, len);

    onHeaders(res, function () {

      // Only set this if we didn't specify a custom extension type
      if (!customExtensionType && !res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', contentType);
      }

      res.setHeader('Content-Length', len);

      if (etaggifyResponse(etag)) {
        data = '';
      }
    });

    // On next tick so it's chainable
    process.nextTick(function () {

      res.end(data);
    });

    return res;
  }

  function sendFile (pathname, existingStream, previousPath) {
    var stream = existingStream || through();

    var indexPath = path.join(pathname, indexFile);
    if (_.endsWith(pathname, '/') && !existingStream) {
      return sendFile(indexPath, stream, pathname);
    }

    provider.get(req, pathname, function(err, meta, readStream) {
      if (err && !existingStream) {
        return sendFile(indexPath, stream, pathname);
      } else if (err) {
        var error = new Error('Content Fetch Failed');
        error.status = err.status || 404;

        process.nextTick(function() { stream.emit('error', error); });
        return stream;
      } else if (
        previousPath &&
        _.endsWith(pathname, indexFile) &&
        !_.endsWith(previousPath, '/')
      ) {
        var loc = previousPath + '/';
        if (req._parsedUrl.query) loc += '?' + req._parsedUrl.query;
        res.__.redirect(loc, 301);
        return stream;
      }

      readStream.pipe(stream);

      var contentType = mime.contentType(path.extname(pathname));
      onHeaders(res, function() {
        res.setHeader('Content-Type', contentType);

        if (!res.getHeader('Content-Length')) {
          res.setHeader('Content-Length', meta.size);
        }

        etaggifyResponse(meta.etag);
        stream.emit('headers', res);
      });

      stream.pipe(res);
    });

    onFinished(res, function () { destroy(stream); });

    // Extend the stream so response helpers
    // are chainable in any order
    return stream;
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
    res.__.send('Redirecting to ' + location  + ' ...');
  }

  function generateEtag (data, len) {

    var isHead = req.method === 'HEAD';
    var etag;

    if (len !== undefined && (isHead || req.method === 'GET')) {
      if (!res.getHeader('ETag') && provider.generateEtag) {
        etag = provider.generateEtag(data);
      }
    }

    return etag;
  }

  function etaggifyResponse (etag) {

    // Set ETag header
    if (etag) {
      res.setHeader('ETag', etag);
    }

    var f = cacheIsFresh(req, res);

    // Remove headers if Etag is fresh
    if (f) {
      res.statusCode = 304;
      res.removeHeader('Content-Type');
      res.removeHeader('Content-Length');
      res.removeHeader('Transfer-Encoding');
    }

    return f;
  }

  function cacheIsFresh () {

    var reqEtag = req.headers['if-none-match'];
    var resEtag = res.getHeader('ETag');

    // If etags disabled, don't want to assume
    // that undefined etags are equal
    if (reqEtag === undefined || resEtag === undefined) {
      return false;
    }

    return reqEtag === resEtag;
  }

  return res;
};
