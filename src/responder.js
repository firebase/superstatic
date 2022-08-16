/**
 * Copyright (c) 2022 Google LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const _ = require("lodash");
const mime = require("mime-types");
const path = require("path");
const onFinished = require("on-finished");
const destroy = require("destroy");

const awaitFinished = (res) => {
  return new Promise((resolve) => {
    onFinished(res, resolve);
  });
};

const Responder = function (req, res, options) {
  this.req = req;
  this.res = res;
  this.provider = options.provider;
  this.config = options.config || {};
  this.rewriters = options.rewriters || {};
  this.compressor = options.compressor;
};

Responder.prototype.isNotModified = function (stats) {
  if (stats.etag && stats.etag === this.req.headers["if-none-match"]) {
    return true;
  }

  let reqModified = this.req.headers["if-modified-since"];
  if (reqModified) {
    reqModified = new Date(reqModified).getTime();
  }
  if (stats.modified && reqModified && stats.modified < reqModified) {
    return true;
  }

  return false;
};

Responder.prototype.handle = function (item, next) {
  const self = this;
  return this._handle(item)
    .then((responded) => {
      if (!responded && next) {
        next();
      }
      return responded;
    })
    .catch((err) => {
      return self.handleError(err);
    });
};

Responder.prototype._handle = function (item) {
  if (_.isArray(item)) {
    return this.handleStack(item);
  } else if (_.isString(item)) {
    return this.handleFile({ file: item });
  } else if (_.isPlainObject(item)) {
    if (item.file) {
      return this.handleFile(item);
    } else if (item.redirect) {
      return this.handleRedirect(item);
    } else if (item.rewrite) {
      return this.handleRewrite(item);
    } else if (item.data) {
      return this.handleData(item);
    }
  } else if (_.isFunction(item)) {
    return this.handleMiddleware(item);
  }

  return Promise.reject(
    new Error(JSON.stringify(item) + " is not a recognized responder directive")
  );
};

Responder.prototype.handleError = function (err) {
  this.res.statusCode = 500;
  console.log(err.stack);
  this.res.end("Unexpected error occurred.");
};

Responder.prototype.handleStack = function (stack) {
  const self = this;
  if (stack.length) {
    return this._handle(stack.shift()).then((responded) => {
      return responded ? true : self.handleStack(stack);
    });
  }

  return Promise.resolve(false);
};

Responder.prototype.handleFile = function (file) {
  const self = this;
  return this.provider(this.req, file.file).then((result) => {
    if (!result) {
      return false;
    }

    if (self.isNotModified(result)) {
      return self.handleNotModified(result);
    }

    return self.handleFileStream(file, result);
  });
};

Responder.prototype.handleFileStream = function (file, result) {
  const self = this;

  this.streamedFile = file;
  this.res.statusCode = file.status || 200;
  if (this.res.statusCode === 200 && file.file === this.config.errorPage) {
    this.res.statusCode = 404;
  }
  this.res.setHeader(
    "Content-Type",
    result.contentType || mime.contentType(path.extname(file.file))
  );
  if (result.size) {
    this.res.setHeader("Content-Length", result.size);
  }
  if (result.etag) {
    this.res.setHeader("ETag", result.etag);
  }
  if (result.modified) {
    this.res.setHeader(
      "Last-Modified",
      new Date(result.modified).toUTCString()
    );
  }

  if (this.compressor) {
    this.compressor(this.req, this.res, () => {
      result.stream.pipe(self.res);
    });
  } else {
    result.stream.pipe(self.res);
  }

  return awaitFinished(this.res).then(() => {
    destroy(result.stream);
    return true;
  });
};

Responder.prototype.handleNotModified = function () {
  this.res.statusCode = 304;
  this.res.removeHeader("Content-Type");
  this.res.removeHeader("Content-Length");
  this.res.removeHeader("Transfer-Encoding");
  this.res.end();
  return true;
};

Responder.prototype.handleRedirect = function (redirect) {
  this.res.statusCode = redirect.status || 301;
  this.res.setHeader("Location", redirect.redirect);
  this.res.setHeader("Content-Type", "text/html; charset=utf-8");
  this.res.end("Redirecting to " + redirect.redirect);
  return Promise.resolve(true);
};

Responder.prototype.handleMiddleware = function (middleware) {
  const self = this;
  return new Promise((resolve) => {
    middleware(self.req, self.res, () => {
      resolve(false);
    });
  });
};

Responder.prototype.handleRewrite = function (item) {
  const self = this;
  if (item.rewrite.destination) {
    return self.handleFile({ file: item.rewrite.destination });
  }

  for (const key in this.rewriters) {
    if (item.rewrite[key]) {
      return this.rewriters[key](item.rewrite, this).then((result) => {
        return self._handle(result);
      });
    }
  }
  return Promise.reject(
    new Error(
      "Unable to find a matching rewriter for " + JSON.stringify(item.rewrite)
    )
  );
};

Responder.prototype.handleData = function (data) {
  this.res.statusCode = data.status || 200;
  this.res.setHeader(
    "Content-Type",
    data.contentType || "text/html; charset=utf-8"
  );
  this.res.end(data.data);
  return Promise.resolve(true);
};

module.exports = Responder;
