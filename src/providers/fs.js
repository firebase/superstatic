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

const crypto = require("crypto");
const fs = require("fs");
const pathjoin = require("join-path");
const _ = require("lodash");

const multiStat = function (paths) {
  const pathname = paths.shift();
  return new Promise((resolve, reject) => {
    fs.stat(pathname, (err, stat) => {
      if (err) {
        return reject(err);
      }
      resolve(stat);
    });
  }).then(
    (stat) => {
      stat.path = pathname;
      return stat;
    },
    (err) => {
      if (paths.length) {
        return multiStat(paths);
      }
      return Promise.reject(err);
    }
  );
};

module.exports = function (options) {
  const etagCache = {};
  const cwd = options.cwd || process.cwd();
  let publicPaths = options.public || ["."];
  if (!_.isArray(publicPaths)) {
    publicPaths = [publicPaths];
  }

  function _fetchEtag(pathname, stat) {
    return new Promise((resolve, reject) => {
      const cached = etagCache[pathname];
      if (cached && cached.timestamp === stat.mtime) {
        return resolve(cached.value);
      }

      // the file you want to get the hash
      const fd = fs.createReadStream(pathname);
      const hash = crypto.createHash("md5");
      hash.setEncoding("hex");

      fd.on("error", (err) => {
        reject(err);
      });

      fd.on("end", () => {
        hash.end();
        const etag = hash.read();
        etagCache[pathname] = {
          timestamp: stat.mtime,
          value: etag,
        };
        resolve(etag);
      });

      // read all file and pipe it (write it) to the hash object
      return fd.pipe(hash);
    });
  }

  return function (req, pathname) {
    pathname = decodeURI(pathname);
    // jumping to parent directories is not allowed
    if (
      pathname.indexOf("../") >= 0 ||
      pathname.indexOf("..\\") >= 0 ||
      pathname.toLowerCase().indexOf("..%5c") >= 0
    ) {
      return Promise.resolve(null);
    }

    const result = {};
    let foundPath;
    const fullPathnames = publicPaths.map((p) => {
      return pathjoin(cwd, p, pathname);
    });

    return multiStat(fullPathnames)
      .then((stat) => {
        foundPath = stat.path;
        result.modified = stat.mtime.getTime();
        result.size = stat.size;
        return _fetchEtag(stat.path, stat);
      })
      .then((etag) => {
        result.etag = etag;
        result.stream = fs.createReadStream(foundPath);
        return result;
      })
      .catch((err) => {
        if (
          err.code === "ENOENT" ||
          err.code === "ENOTDIR" ||
          err.code === "EISDIR" ||
          err.code === "EINVAL"
        ) {
          return null;
        }
        return Promise.reject(err);
      });
  };
};
