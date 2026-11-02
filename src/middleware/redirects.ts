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

import connect from "connect";
import isUrl from "is-url";
import { ServerResponse } from "node:http";
import pathToRegexp from "path-to-regexp";

import { Configuration, Redirect as RedirectConfig } from "../config";
import { SuperstaticRequest, SuperstaticResponse } from "../options";
import { slasher } from "../utils/pathutils";
import * as patterns from "../utils/patterns";

interface RedirectResult {
  readonly type: number;
  readonly destination: string;
}

function formatExternalUrl(u: string): string {
  const cleaned = u
    .replace("/http:/", "http://")
    .replace("/https:/", "https://");

  return isUrl(cleaned) ? cleaned : u;
}

function addQuery(url: string, qs: string): string {
  if (url.includes("?")) {
    return `${url}&${qs}`;
  } else if (qs.length > 0) {
    return `${url}?${qs}`;
  }
  return url;
}

class Redirect {
  private readonly type: number;
  private readonly glob?: string;
  private readonly regex?: string;
  private readonly destination: string;
  private readonly captureKeys: pathToRegexp.Key[] = [];
  private readonly engine?: "glob" | "pattern";
  private readonly capture?: RegExp;
  private readonly compileDestination?: pathToRegexp.PathFunction;

  constructor(redir: RedirectConfig) {
    this.type = redir.type ?? 301;
    const rawGlob: unknown = slasher(redir.glob ?? redir.source);
    this.glob = typeof rawGlob === "string" ? rawGlob : undefined;
    this.regex = redir.regex;
    this.destination = redir.destination;

    if (/(?:^|\/):/.test(this.destination)) {
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
  }

  test(url: string): RedirectResult | undefined {
    let qs = "";
    let pathname = url;
    const qIndex = pathname.indexOf("?");
    if (qIndex >= 0) {
      qs = pathname.slice(qIndex + 1);
      pathname = pathname.slice(0, qIndex);
    }

    const match = this.capture?.exec(pathname);
    if (match && this.compileDestination) {
      const params: Record<string, string | string[] | undefined> = {};
      if (this.engine === "glob") {
        for (let i = 0; i < this.captureKeys.length; i++) {
          const rawMatch = match[i + 1];
          params[this.captureKeys[i].name] = rawMatch?.includes("/")
            ? rawMatch.split("/")
            : rawMatch;
        }
      } else {
        for (let j = 0; j < match.length; j++) {
          params[j.toString()] = match[j];
        }
        if (match.groups) {
          Object.assign(params, match.groups);
        }
      }

      try {
        const dest = decodeURIComponent(this.compileDestination(params));
        return {
          type: this.type,
          destination: encodeURI(addQuery(dest, qs)),
        };
      } catch {
        return undefined;
      }
    } else if (this.matchesPattern(pathname)) {
      return {
        type: this.type,
        destination: encodeURI(addQuery(this.destination, qs)),
      };
    }
    return undefined;
  }

  private matchesPattern(url: string): boolean {
    if (this.glob) {
      return patterns.configMatcher(url, { glob: this.glob });
    }
    if (this.regex) {
      return patterns.configMatcher(url, { regex: this.regex });
    }
    return false;
  }
}

/**
 * Looks for possible redirects for the given req.url.
 * @returns middleware for handling redirects.
 */
export = function (): (
  req: SuperstaticRequest | connect.IncomingMessage,
  res: SuperstaticResponse | ServerResponse,
  next: connect.NextFunction,
) => void {
  const cache = new WeakMap<RedirectConfig[], Redirect[]>();

  return function (
    req: SuperstaticRequest | connect.IncomingMessage,
    res: SuperstaticResponse | ServerResponse,
    next: connect.NextFunction,
  ): void {
    const config: Configuration["redirects"] =
      "superstatic" in req ? req.superstatic?.redirects : undefined;
    if (!config) {
      return next();
    }
    if (!Array.isArray(config)) {
      return next(new Error("redirects provided in an unrecognized format"));
    }
    if (!req.url) {
      return next();
    }

    let redirects = cache.get(config);
    if (!redirects) {
      redirects = config.map((redir) => new Redirect(redir));
      cache.set(config, redirects);
    }

    let decodedUrl: string;
    try {
      decodedUrl = decodeURI(req.url);
    } catch {
      return next();
    }

    let match: RedirectResult | undefined;
    for (const redirect of redirects) {
      const result = redirect.test(decodedUrl);
      if (result) {
        match = result;
        break;
      }
    }

    if (!match) {
      return next();
    }

    if (!("superstatic" in res) || !res.superstatic) {
      return next(new Error("Responder middleware is not initialized"));
    }

    // Remove leading slash of a url
    const redirectUrl = formatExternalUrl(match.destination);

    void res.superstatic.handle({
      redirect: redirectUrl,
      status: match.type,
    });
  };
};
