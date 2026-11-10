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

import {
  IncomingMessage as ConnectIncomingMessage,
  NextFunction,
  NextHandleFunction,
} from "connect";
import destroy from "destroy";
import * as mime from "mime-types";
import * as http from "node:http";
import * as path from "node:path";
import onFinished from "on-finished";

import { Configuration } from "./config";
import {
  DataDirective as OptionsDataDirective,
  FileDirective as OptionsFileDirective,
  FileStats as OptionsFileStats,
  Provider as OptionsProvider,
  ProviderResult as OptionsProviderResult,
  RedirectDirective as OptionsRedirectDirective,
  ResponderDirective as OptionsResponderDirective,
  ResponderMiddleware as OptionsResponderMiddleware,
  RewriteConfig as OptionsRewriteConfig,
  RewriteDirective as OptionsRewriteDirective,
  RewriterFunction as OptionsRewriterFunction,
} from "./options";
import { isPlainObject } from "./utils/objectutils";

function awaitFinished(res: http.ServerResponse): Promise<void> {
  return new Promise((resolve) => {
    onFinished(res, () => {
      resolve();
    });
  });
}

function isFileDirective(item: unknown): item is Responder.FileDirective {
  return (
    isPlainObject(item) &&
    typeof item.file === "string" &&
    item.file.length > 0 &&
    (item.status === undefined ||
      item.status === null ||
      typeof item.status === "number")
  );
}

function isRedirectDirective(
  item: unknown,
): item is Responder.RedirectDirective {
  return (
    isPlainObject(item) &&
    typeof item.redirect === "string" &&
    item.redirect.length > 0 &&
    (item.status === undefined ||
      item.status === null ||
      typeof item.status === "number")
  );
}

function isRewriteDirective(item: unknown): item is Responder.RewriteDirective {
  return (
    isPlainObject(item) &&
    isPlainObject(item.rewrite) &&
    (item.rewrite.destination === undefined ||
      typeof item.rewrite.destination === "string")
  );
}

function isDataDirective(item: unknown): item is Responder.DataDirective {
  return (
    isPlainObject(item) &&
    (typeof item.data === "string" || item.data instanceof Uint8Array) &&
    (item.status === undefined ||
      item.status === null ||
      typeof item.status === "number") &&
    (item.contentType === undefined || typeof item.contentType === "string")
  );
}

function isMiddleware(item: unknown): item is Responder.ResponderMiddleware {
  return typeof item === "function";
}

/**
 * Handles responder directives and writes HTTP responses.
 */
class Responder {
  req: ConnectIncomingMessage & { superstatic?: Configuration };
  res: http.ServerResponse;
  provider?: Responder.Provider;
  config: Configuration;
  rewriters: Record<string, Responder.RewriterFunction>;
  compressor?: NextHandleFunction | null;
  streamedFile?: Responder.FileDirective;

  /**
   * Creates a Responder for an HTTP request/response pair.
   * @param req incoming HTTP request.
   * @param res outgoing HTTP response.
   * @param options responder configuration and provider options.
   */
  constructor(
    req: ConnectIncomingMessage & { superstatic?: Configuration },
    res: http.ServerResponse,
    options: Responder.ResponderOptions = {},
  ) {
    this.req = req;
    this.res = res;
    this.provider = options.provider;
    this.config = options.config ?? {};
    this.rewriters = options.rewriters ?? {};
    this.compressor = options.compressor;
  }

  /**
   * Checks whether the cached resource has not been modified.
   * @param stats resource metadata containing etag and modified timestamp.
   * @returns true if a 304 Not Modified response should be sent.
   */
  isNotModified(stats: Responder.FileStats): boolean {
    if (stats.etag && stats.etag === this.req.headers["if-none-match"]) {
      return true;
    }

    const statsModified =
      stats.modified instanceof Date
        ? stats.modified.getTime()
        : typeof stats.modified === "string"
          ? new Date(stats.modified).getTime()
          : typeof stats.modified === "number"
            ? stats.modified
            : NaN;
    const ifModifiedSince = this.req.headers["if-modified-since"];
    const reqModified = ifModifiedSince
      ? new Date(ifModifiedSince).getTime()
      : NaN;
    if (
      !Number.isNaN(statsModified) &&
      !Number.isNaN(reqModified) &&
      statsModified < reqModified
    ) {
      return true;
    }

    return false;
  }

  /**
   * Processes a responder directive, invoking `next` if unhandled and handling errors.
   * @param item responder directive or stack of directives.
   * @param next optional continuation callback invoked when unhandled.
   * @returns promise resolving to true if responded, false if passed through, or void on error.
   */
  handle(
    item: Responder.ResponderDirective,
    next?: NextFunction,
  ): Promise<boolean | void> {
    return this._handle(item)
      .then((responded) => {
        if (!responded && next) {
          next();
        }
        return responded;
      })
      .catch((err: unknown) => {
        return this.handleError(err);
      });
  }

  /**
   * Dispatches a single responder directive without top-level error catching.
   * @param item responder directive or stack of directives.
   * @returns promise resolving to true if a response was written, false otherwise.
   */
  _handle(item: Responder.ResponderDirective): Promise<boolean> {
    if (Array.isArray(item)) {
      return this.handleStack(item);
    } else if (typeof item === "string") {
      return this.handleFile({ file: item });
    }
    const directive: unknown = item;
    if (isPlainObject(directive)) {
      if (isFileDirective(directive)) {
        return this.handleFile(directive);
      } else if (isRedirectDirective(directive)) {
        return this.handleRedirect(directive);
      } else if (isRewriteDirective(directive)) {
        return this.handleRewrite(directive);
      } else if (isDataDirective(directive)) {
        return this.handleData(directive);
      }
    } else if (isMiddleware(directive)) {
      return this.handleMiddleware(directive);
    }

    return Promise.reject(
      new Error(
        JSON.stringify(directive) + " is not a recognized responder directive",
      ),
    );
  }

  /**
   * Writes a 500 error response or destroys the response if headers were already sent.
   * @param err error thrown while handling a directive or stream.
   */
  handleError(err: unknown): void {
    console.log(err instanceof Error ? err.stack : err);
    if (!this.res.headersSent) {
      const errorMessage = "Unexpected error occurred.";
      this.res.statusCode = 500;
      this.res.removeHeader("Content-Length");
      this.res.removeHeader("Content-Encoding");
      this.res.removeHeader("Transfer-Encoding");
      this.res.removeHeader("ETag");
      this.res.removeHeader("Last-Modified");
      this.res.setHeader("Content-Type", "text/plain; charset=utf-8");
      this.res.setHeader("Content-Length", Buffer.byteLength(errorMessage));
      this.res.end(errorMessage);
    } else {
      this.res.destroy();
    }
  }

  /**
   * Sequentially evaluates a stack of responder directives until one responds.
   * @param stack list of responder directives to evaluate in order.
   * @returns promise resolving to true if any directive responded, false otherwise.
   */
  handleStack(stack: Responder.ResponderDirective[]): Promise<boolean> {
    if (stack.length > 0) {
      const [first, ...rest] = stack;
      return this._handle(first).then((responded) => {
        return responded ? true : this.handleStack(rest);
      });
    }

    return Promise.resolve(false);
  }

  /**
   * Fetches a file from the configured provider and streams or caches it.
   * @param file file directive describing the target path and status code.
   * @returns promise resolving to true if the file was handled, false if not found.
   */
  handleFile(file: Responder.FileDirective): Promise<boolean> {
    if (!this.provider) {
      return Promise.reject(new Error("No provider configured"));
    }
    return Promise.resolve(this.provider(this.req, file.file)).then(
      (result) => {
        if (!result) {
          return false;
        }

        if (this.isNotModified(result)) {
          return this.handleNotModified();
        }

        return this.handleFileStream(file, result);
      },
    );
  }

  /**
   * Streams provider file content and headers to the HTTP response.
   * @param file file directive describing the target path and status code.
   * @param result provider result containing metadata and readable stream.
   * @returns promise resolving to true once the response finishes.
   */
  handleFileStream(
    file: Responder.FileDirective,
    result: Responder.ProviderResult,
  ): Promise<boolean> {
    this.streamedFile = file;
    this.res.statusCode = file.status ?? 200;
    if (this.res.statusCode === 200 && file.file === this.config.errorPage) {
      this.res.statusCode = 404;
    }
    const contentType =
      result.contentType ?? mime.contentType(path.extname(file.file));
    if (contentType) {
      this.res.setHeader("Content-Type", contentType);
    }
    if (result.size) {
      this.res.setHeader("Content-Length", result.size);
    }
    if (result.etag) {
      this.res.setHeader("ETag", result.etag);
    }
    if (result.modified != null) {
      const modifiedDate =
        result.modified instanceof Date
          ? result.modified
          : new Date(result.modified);
      if (!Number.isNaN(modifiedDate.getTime())) {
        this.res.setHeader("Last-Modified", modifiedDate.toUTCString());
      }
    }

    result.stream.on("error", (err) => {
      this.handleError(err);
      destroy(result.stream);
    });

    if (this.compressor) {
      this.compressor(this.req, this.res, () => {
        if (!result.stream.destroyed && !this.res.destroyed) {
          result.stream.pipe(this.res);
        }
      });
    } else {
      result.stream.pipe(this.res);
    }

    return awaitFinished(this.res).then(() => {
      destroy(result.stream);
      return true;
    });
  }

  /**
   * Sends a 304 Not Modified response with entity headers stripped.
   * @returns true indicating the response was handled.
   */
  handleNotModified(): boolean {
    this.res.statusCode = 304;
    this.res.removeHeader("Content-Type");
    this.res.removeHeader("Content-Length");
    this.res.removeHeader("Transfer-Encoding");
    this.res.end();
    return true;
  }

  /**
   * Sends an HTTP redirect response.
   * @param redirect redirect directive containing destination URL and optional status code.
   * @returns promise resolving to true.
   */
  handleRedirect(redirect: Responder.RedirectDirective): Promise<boolean> {
    this.res.statusCode = redirect.status ?? 301;
    this.res.setHeader("Location", redirect.redirect);
    this.res.setHeader("Content-Type", "text/html; charset=utf-8");
    this.res.end("Redirecting to " + redirect.redirect);
    return Promise.resolve(true);
  }

  /**
   * Executes a Connect-style middleware function.
   * @param middleware middleware function to invoke.
   * @returns promise resolving to false if `next` is called.
   */
  handleMiddleware(
    middleware: Responder.ResponderMiddleware,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const next = (err?: unknown): void => {
        if (err) {
          reject(
            err instanceof Error
              ? err
              : new Error(typeof err === "string" ? err : JSON.stringify(err)),
          );
        } else {
          resolve(false);
        }
      };
      Promise.resolve(middleware(this.req, this.res, next)).catch(reject);
    });
  }

  /**
   * Handles a rewrite directive via destination file or registered custom rewriter.
   * @param item rewrite directive configuration.
   * @returns promise resolving to true if handled, false otherwise.
   */
  handleRewrite(item: Responder.RewriteDirective): Promise<boolean> {
    if (item.rewrite.destination) {
      return this.handleFile({ file: item.rewrite.destination });
    }

    for (const [key, rewriter] of Object.entries(this.rewriters)) {
      if (item.rewrite[key]) {
        return rewriter(item.rewrite, this).then((result) => {
          return this._handle(result);
        });
      }
    }
    return Promise.reject(
      new Error(
        "Unable to find a matching rewriter for " +
          JSON.stringify(item.rewrite),
      ),
    );
  }

  /**
   * Writes raw string or buffer data directly to the HTTP response.
   * @param data data directive containing payload, status, and content type.
   * @returns promise resolving to true.
   */
  handleData(data: Responder.DataDirective): Promise<boolean> {
    this.res.statusCode = data.status ?? 200;
    this.res.setHeader(
      "Content-Type",
      data.contentType ?? "text/html; charset=utf-8",
    );
    this.res.end(data.data);
    return Promise.resolve(true);
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Responder {
  export type FileStats = OptionsFileStats;
  export type ProviderResult = OptionsProviderResult;
  export type Provider = OptionsProvider;
  export type FileDirective = OptionsFileDirective;
  export type RedirectDirective = OptionsRedirectDirective;
  export type RewriteConfig = OptionsRewriteConfig;
  export type RewriteDirective = OptionsRewriteDirective;
  export type DataDirective = OptionsDataDirective;
  export type ResponderMiddleware = OptionsResponderMiddleware;
  export type ResponderDirective = OptionsResponderDirective;
  export type RewriterFunction = OptionsRewriterFunction;
  export interface ResponderOptions {
    provider?: Provider;
    config?: Configuration;
    rewriters?: Record<string, RewriterFunction>;
    compressor?: NextHandleFunction | null;
  }
}

export = Responder;
