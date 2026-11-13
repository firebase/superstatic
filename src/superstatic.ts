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

import compression from "compression";
import {
  HandleFunction,
  IncomingMessage as ConnectIncomingMessage,
  NextFunction,
  NextHandleFunction,
} from "connect";
import { ServerResponse } from "node:http";
import { createRequire } from "node:module";

import activator from "./activator";
import { Configuration } from "./config";
import loadConfigFile from "./loaders/config-file";
import notFound from "./middleware/missing";
import { MiddlewareOptions, Provider } from "./options";
import Responder from "./responder";
import promiseback from "./utils/promiseback";

interface Router extends NextHandleFunction {
  use(...handlers: HandleFunction[]): this;
  use(route: string, ...handlers: HandleFunction[]): this;
  handle(
    req: ConnectIncomingMessage,
    res: ServerResponse,
    callback: NextFunction,
  ): void;
}

const requireModule: (id: string) => unknown = createRequire(__filename);
const makerouter = requireModule("router") as (
  options?: Record<string, unknown>,
) => Router;
const fsProvider = requireModule("./providers/fs") as (
  options: Configuration & { cwd?: string },
) => Provider;

const defaultCompressor = compression() as unknown as NextHandleFunction;

const CWD = process.cwd();

/**
 * Superstatic returns a router that can be used in a server.
 * @param spec superstatic options.
 * @returns router handler.
 */
function superstatic(spec: MiddlewareOptions = {}): NextHandleFunction {
  spec.stack ??= "default";

  spec.fallthrough ??= true;

  let stack: string[];
  if (typeof spec.stack === "string") {
    if (!Object.hasOwn(superstatic.stacks, spec.stack)) {
      throw new TypeError(`Unknown middleware stack "${spec.stack}"`);
    }
    stack = superstatic.stacks[spec.stack];
    spec.stack = stack;
  } else {
    stack = spec.stack;
  }

  const router = makerouter();
  const cwd = spec.cwd ?? CWD;

  // Load data
  const config = loadConfigFile(spec.config);
  spec.config = config;
  config.errorPage = config.errorPage ?? "/404.html";

  // Set up provider
  const provider: Provider = spec.provider
    ? promiseback(spec.provider, 2)
    : fsProvider({ cwd, ...config });

  // Select compression middleware
  let compressor: NextHandleFunction | null;
  if (typeof spec.compression === "function") {
    compressor = spec.compression as NextHandleFunction;
  } else if (spec.compression ?? spec.gzip) {
    compressor = defaultCompressor;
  } else {
    compressor = null;
  }

  // Setup helpers
  router.use(
    (
      req: ConnectIncomingMessage,
      res: ServerResponse & { superstatic?: Responder },
      next: NextFunction,
    ) => {
      res.superstatic = new Responder(req, res, {
        provider: provider,
        config: config,
        compressor: compressor,
        rewriters: spec.rewriters,
      });

      next();
    },
  );

  router.use(activator({ ...spec, stack }, provider));

  // Handle not found pages
  if (!spec.fallthrough) {
    router.use(notFound(spec));
  }

  return router;
}

const stacks: {
  default: string[];
  strict: string[];
  [key: string]: string[];
} = {
  default: [
    "protect",
    "redirects",
    "headers",
    "env",
    "files",
    "rewrites",
    "missing",
  ],
  strict: ["redirects", "headers", "files", "rewrites", "missing"],
};

superstatic.stacks = stacks;

export = superstatic;
