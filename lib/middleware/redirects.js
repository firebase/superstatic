/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const isUrl = require("is-url");
const _ = require("lodash");

const patterns = require("../utils/patterns");
const pathToRegexp = require("path-to-regexp");
const slasher = require("glob-slasher");

function formatExternalUrl(u) {
  const cleaned = u
    .replace("/http:/", "http://")
    .replace("/https:/", "https://");

  return isUrl(cleaned) ? cleaned : u;
}

function addQuery(url, qs) {
  if (url.indexOf("?") >= 0) {
    return url + "&" + qs;
  } else if (qs && qs.length) {
    return url + "?" + qs;
  }
  return url;
}

const Redirect = function(glob, regex, destination, type) {
  this.type = type || 301;
  this.glob = slasher(glob);
  this.regex = regex;
  this.destination = destination;

  if (this.destination.match(/(?:^|\/):/)) {
    this.captureKeys = [];
    if (this.glob) {
      this.engine = "glob";
      this.capture = pathToRegexp(this.glob, this.captureKeys);
    }
    if (this.regex) {
      this.engine = "pattern";
      this.capture = patterns.createRaw(this.regex);
    }
    this.compileDestination = pathToRegexp.compile(this.destination);
  }
};

Redirect.prototype.test = function(url) {
  let qs = "";
  if (url.indexOf("?") >= 0) {
    const parts = url.split("?");
    url = parts[0];
    qs = parts[1];
  }

  let match;
  if (this.capture) {
    match = this.capture.exec(url);
  }
  if (match) {
    let params = {};
    if (this.engine === "glob") {
      for (let i = 0; i < this.captureKeys.length; i++) {
        let m = match[i + 1];
        if (m && m.indexOf("/") >= 0) {
          m = m.split("/");
        }

        params[this.captureKeys[i].name] = m;
      }
    } else {
      for (let j = 0; j < match.length; j++) {
        params[j.toString()] = match[j];
      }
      if (match.groups) {
        params = Object.assign(params, match.groups);
      }
    }

    try {
      const dest = decodeURIComponent(this.compileDestination(params));
      return {
        type: this.type,
        destination: encodeURI(addQuery(dest, qs))
      };
    } catch (e) {
      return undefined;
    }
  } else if (
    patterns.configMatcher(url, { glob: this.glob, regex: this.regex })
  ) {
    return {
      type: this.type,
      destination: encodeURI(addQuery(this.destination, qs))
    };
  }
  return undefined;
};

module.exports = function() {
  return function(req, res, next) {
    const config = _.get(req, "superstatic.redirects");
    if (!config) {
      return next();
    }

    const redirects = [];
    if (_.isArray(config)) {
      config.forEach((redir) => {
        const glob = redir.glob || redir.source;
        redirects.push(
          new Redirect(glob, redir.regex, redir.destination, redir.type)
        );
      });
    } else {
      throw new Error("redirects provided in an unrecognized format");
    }

    const matcher = function(url) {
      for (let i = 0; i < redirects.length; i++) {
        const result = redirects[i].test(url);
        if (result) {
          return result;
        }
      }
      return undefined;
    };

    const match = matcher(req.url);

    if (!match) {
      return next();
    }

    // Remove leading slash of a url
    const redirectUrl = formatExternalUrl(match.destination);

    return res.superstatic.handle({
      redirect: redirectUrl,
      status: match.type
    });
  };
};
