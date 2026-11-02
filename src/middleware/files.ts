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

import connect, { NextFunction } from "connect";
import { ServerResponse } from "node:http";
import * as url from "node:url";

import { Configuration } from "../config";
import { SuperstaticRequest, SuperstaticResponse } from "../options";
import { i18nContentOptions } from "../utils/i18n";
import * as pathutils from "../utils/pathutils";

interface ProviderResult {
  modified?: number | Date | null;
  size?: number;
  etag?: string;
  contentType?: string;
  stream: NodeJS.ReadableStream;
}

type Provider = (
  req: SuperstaticRequest | connect.IncomingMessage,
  pathname: string,
) => Promise<ProviderResult | null | undefined>;

interface FilesResponder {
  provider?: Provider;
  handle: (item: { redirect: string; status?: number }) => Promise<unknown>;
  handleFileStream: (
    file: { file: string; status?: number },
    result: ProviderResult,
  ) => Promise<unknown>;
  handleError: (err: unknown) => void;
}

type FilesResponse = Omit<SuperstaticResponse, "superstatic"> & {
  superstatic: FilesResponder;
};

/**
 * We cannot redirect to "", redirect to "/" instead.
 * @param path path
 * @returns normalized path
 */
function normalizeRedirectPath(path: string): string {
  return path || "/";
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
  req: SuperstaticRequest | connect.IncomingMessage,
  responder: FilesResponder,
  p: string,
): Promise<ProviderResult | undefined> {
  const provider = responder.provider;
  if (!provider) {
    return undefined;
  }

  const promises: Promise<ProviderResult | null | undefined>[] = [];

  const i18n = "superstatic" in req ? req.superstatic?.i18n : undefined;
  if (i18n?.root) {
    const paths = i18nContentOptions(p, req);
    for (const pth of paths) {
      promises.push(provider(req, pth));
    }
  }
  promises.push(provider(req, p));

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
 * @param next middleware continuation callback.
 */
async function handleRequest(
  req: SuperstaticRequest | connect.IncomingMessage,
  res: FilesResponse | ServerResponse,
  next: NextFunction,
): Promise<void> {
  const config: Configuration =
    "superstatic" in req && req.superstatic ? req.superstatic : {};
  const trailingSlashBehavior = config.trailingSlash;

  if (!req.url) {
    next();
    return;
  }

  const responder = "superstatic" in res ? res.superstatic : undefined;
  if (!responder) {
    next();
    return;
  }

  const parsedUrl = url.parse(req.url);
  const pathname = pathutils.normalizeMultiSlashes(parsedUrl.pathname ?? "");
  const search = parsedUrl.search ?? "";

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
      return;
    }
    await responder.handleFileStream({ file: pathname }, result);
    return;
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
      return;
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
      return;
    }
    if (trailingSlashBehavior === true && !hasTrailingSlash) {
      await responder.handle({
        redirect: pathutils.addTrailingSlash(pathname) + search,
      });
      return;
    }
    // If we haven't returned yet, our path is "correct" and we should be serving a file, not redirecting.
    await responder.handleFileStream(
      { file: pathAsDirectoryWithIndex },
      pathAsDirectoryWithIndexResult,
    );
    return;
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
        return;
      }
      if (trailingSlashBehavior === true && !hasTrailingSlash) {
        // If we are missing a slash and need to add it, we want to make sure our appended path is cleaned up.
        appendedPath = pathutils.removeTrailingString(appendedPath, ".html");
        appendedPath = pathutils.removeTrailingString(appendedPath, "/index");
        await responder.handle({
          redirect: pathutils.addTrailingSlash(appendedPath) + search,
        });
        return;
      }
      // If we've gotten this far and still have `/index.html` on the end, we want to remove it from the URL.
      if (appendedPath.endsWith("/index.html")) {
        await responder.handle({
          redirect: normalizeRedirectPath(
            pathutils.removeTrailingString(appendedPath, "/index.html") +
              search,
          ),
        });
        return;
      }
      // And if we should be serving a file and we're at the right path, we'll serve the file.
      await responder.handleFileStream(
        { file: appendedPath },
        appendedPathResult,
      );
      return;
    }

    next();
    return;
  }

  next();
}

/**
 * Returns middleware for serving static files, directory indexes, and clean URLs.
 * @returns middleware for serving static files.
 */
function files(): connect.NextHandleFunction {
  return (
    req: SuperstaticRequest | connect.IncomingMessage,
    res: FilesResponse | ServerResponse,
    next: NextFunction,
  ): void => {
    handleRequest(req, res, next).catch((err: unknown) => {
      if ("superstatic" in res && res.superstatic) {
        res.superstatic.handleError(err);
      } else {
        next(err);
      }
    });
  };
}

export = files;
