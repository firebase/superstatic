/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const crypto = require("crypto");
const fs = require("fs");
const pathjoin = require("join-path");
const RSVP = require("rsvp");
const _ = require("lodash");

const statPromise = RSVP.denodeify(fs.stat);
const multiStat = function(paths) {
  const pathname = paths.shift();
  return statPromise(pathname).then(
    (stat) => {
      stat.path = pathname;
      return stat;
    },
    (err) => {
      if (paths.length) {
        return multiStat(paths);
      }
      return RSVP.reject(err);
    }
  );
};

module.exports = function(options) {
  const etagCache = {};
  const cwd = options.cwd || process.cwd();
  let publicPaths = options.public || ["."];
  if (!_.isArray(publicPaths)) {
    publicPaths = [publicPaths];
  }

  function _fetchEtag(pathname, stat) {
    return new RSVP.Promise((resolve, reject) => {
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
          value: etag
        };
        resolve(etag);
      });

      // read all file and pipe it (write it) to the hash object
      return fd.pipe(hash);
    });
  }

  return function(req, pathname) {
    pathname = decodeURI(pathname);
    // jumping to parent directories is not allowed
    if (
      pathname.indexOf("../") >= 0 ||
      pathname.indexOf("..\\") >= 0 ||
      pathname.toLowerCase().indexOf("..%5c") >= 0
    ) {
      return RSVP.resolve(null);
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
        return RSVP.reject(err);
      });
  };
};
