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

import { ServerResponse } from "node:http";
import connect from "connect";

import { Configuration } from "../config";
import { MiddlewareOptions, Provider, ProviderResult } from "../options";
import Responder from "../responder";
import { i18nContentOptions } from "../utils/i18n";
import * as pathutils from "../utils/pathutils";

/**
 * We cannot redirect to "", redirect to "/" instead.
 * @param path path
 * @returns normalized path
 */
function normalizeRedirectPath(path: string): string {
  return path || "/";
}

/**
 * Extracts normalized pathname and search string from a request URL without `url.parse`.
 * @param reqUrl raw request URL.
 * @returns normalized pathname and query string.
 */
function parseRequestUrl(reqUrl: string): {
  pathname: string;
  search: string;
} {
  const hashIndex = reqUrl.indexOf("#");
  const urlWithoutHash = hashIndex === -1 ? reqUrl : reqUrl.slice(0, hashIndex);
  const queryIndex = urlWithoutHash.indexOf("?");
  const rawPathname =
    queryIndex === -1 ? urlWithoutHash : urlWithoutHash.slice(0, queryIndex);
  const search = queryIndex === -1 ? "" : urlWithoutHash.slice(queryIndex);
  return {
    pathname: pathutils.normalizeMultiSlashes(rawPathname),
    search,
  };
}

/**
 * Uses the provider to look for a file given a path.
 * This also takes into account i18n settings.
 * @param req the Request.
 * @param responder the Superstatic responder.
 * @param p the path to search for.
 * @returns a non-null value if a file is found.
 */
async function providerResult(
  req: connect.IncomingMessage & { superstatic?: Configuration },
  responder: Responder,
  p: string,
): Promise<ProviderResult | undefined> {
  const provider = (responder as { provider?: Provider }).provider;
  if (!provider) {
    throw new Error("No provider configured");
  }

  const promises: Promise<ProviderResult | null | undefined>[] = [];

  const i18n = req.superstatic?.i18n;
  if (i18n?.root) {
    const paths = i18nContentOptions(p, req);
    for (const pth of paths) {
      promises.push(Promise.resolve(provider(req, pth)));
    }
  }
  promises.push(Promise.resolve(provider(req, p)));

  const results = await Promise.all(promises);
  for (const r of results) {
    if (r) {
      return r;
    }
  }
  return undefined;
}

/**
 * Handles static file resolution, directory index redirects, and clean URLs.
 * @param req the Request.
 * @param res the Response.
 * @returns true if a response or redirect was handled, false to pass to next().
 */
async function handleRequest(
  req: connect.IncomingMessage & { superstatic?: Configuration },
  res: ServerResponse & { superstatic?: Responder },
): Promise<boolean> {
  const config: Configuration = req.superstatic ?? {};
  const trailingSlashBehavior = config.trailingSlash;

  if (!req.url) {
    return false;
  }

  const responder = res.superstatic;
  if (!responder) {
    return false;
  }

  const { pathname, search } = parseRequestUrl(req.url);
  const cleanUrlRules = Boolean(config.cleanUrls);

  // Exact file always wins.
  const result = await providerResult(req, responder, pathname);
  if (result) {
    // If we are using cleanURLs, we'll trim off any `.html` (or `/index.html`), if it exists.
    if (cleanUrlRules && pathname.endsWith(".html")) {
      let redirPath = pathutils.removeTrailingString(pathname, ".html");
      if (redirPath.endsWith("/index")) {
        redirPath = pathutils.removeTrailingString(redirPath, "/index");
      }
      if (trailingSlashBehavior === true) {
        redirPath = pathutils.addTrailingSlash(redirPath);
      }
      await responder.handle({
        redirect: normalizeRedirectPath(redirPath + search),
      });
      return true;
    }
    await responder.handleFileStream({ file: pathname }, result);
    return true;
  }

  // Now, let's consider the trailing slash.
  const hasTrailingSlash = pathutils.hasTrailingSlash(pathname);

  // We want to check for some other files, namely an `index.html` if this were a directory.
  const pathAsDirectoryWithIndex = pathutils.asDirectoryIndex(
    pathutils.addTrailingSlash(pathname),
  );
  const pathAsDirectoryWithIndexResult = await providerResult(
    req,
    responder,
    pathAsDirectoryWithIndex,
  );

  // If an exact file wins now, we know that this path leads us to a directory.
  if (pathAsDirectoryWithIndexResult) {
    if (
      trailingSlashBehavior === undefined &&
      !hasTrailingSlash &&
      !cleanUrlRules
    ) {
      await responder.handle({
        redirect: pathutils.addTrailingSlash(pathname) + search,
      });
      return true;
    }
    if (
      trailingSlashBehavior === false &&
      hasTrailingSlash &&
      pathname !== "/"
    ) {
      // No infinite redirects
      await responder.handle({
        redirect: normalizeRedirectPath(
          pathutils.removeTrailingSlash(pathname) + search,
        ),
      });
      return true;
    }
    if (trailingSlashBehavior === true && !hasTrailingSlash) {
      await responder.handle({
        redirect: pathutils.addTrailingSlash(pathname) + search,
      });
      return true;
    }
    // If we haven't returned yet, our path is "correct" and we should be serving a file, not redirecting.
    await responder.handleFileStream(
      { file: pathAsDirectoryWithIndex },
      pathAsDirectoryWithIndexResult,
    );
    return true;
  }

  // Let's check on the clean URLs property.
  // We want to know if a specific mutation of the path exists.
  if (cleanUrlRules) {
    let appendedPath = pathname;
    if (hasTrailingSlash) {
      if (trailingSlashBehavior !== undefined) {
        // We want to remove the trailing slash and see if a file exists with an .html attached.
        appendedPath = pathutils.removeTrailingString(pathname, "/") + ".html";
      }
    } else {
      // Let's see if our path is a simple clean URL missing a .HTML5
      appendedPath += ".html";
    }

    const appendedPathResult = await providerResult(
      req,
      responder,
      appendedPath,
    );
    if (appendedPathResult) {
      // Okay, back to trailing slash behavior
      if (trailingSlashBehavior === false && hasTrailingSlash) {
        // If we had a slash to begin with, and we could be serving a file without it, we'll remove the slash.
        // (This works because we are in the cleanURL block.)
        await responder.handle({
          redirect: normalizeRedirectPath(
            pathutils.removeTrailingSlash(pathname) + search,
          ),
        });
        return true;
      }
      if (trailingSlashBehavior === true && !hasTrailingSlash) {
        // If we are missing a slash and need to add it, we want to make sure our appended path is cleaned up.
        appendedPath = pathutils.removeTrailingString(appendedPath, ".html");
        appendedPath = pathutils.removeTrailingString(appendedPath, "/index");
        await responder.handle({
          redirect: pathutils.addTrailingSlash(appendedPath) + search,
        });
        return true;
      }
      // If we've gotten this far and still have `/index.html` on the end, we want to remove it from the URL.
      if (appendedPath.endsWith("/index.html")) {
        await responder.handle({
          redirect: normalizeRedirectPath(
            pathutils.removeTrailingString(appendedPath, "/index.html") +
              search,
          ),
        });
        return true;
      }
      // And if we should be serving a file and we're at the right path, we'll serve the file.
      await responder.handleFileStream(
        { file: appendedPath },
        appendedPathResult,
      );
      return true;
    }

    return false;
  }

  return false;
}

/**
 * Returns middleware for serving static files, directory indexes, and clean URLs.
 * @param spec superstatic middleware options.
 * @returns middleware for serving static files.
 */
function files(spec?: MiddlewareOptions): connect.NextHandleFunction;
function files(): connect.NextHandleFunction {
  return (
    req: connect.IncomingMessage & { superstatic?: Configuration },
    res: ServerResponse & { superstatic?: Responder },
    next: connect.NextFunction,
  ): void => {
    handleRequest(req, res).then(
      (handled) => {
        if (!handled) {
          next();
        }
      },
      (err: unknown) => {
        if (typeof res.superstatic?.handleError === "function") {
          res.superstatic.handleError(err);
        } else {
          next(err);
        }
      },
    );
  };
}

export = files;
