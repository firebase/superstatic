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
import { ServerResponse } from "node:http";

import { Configuration } from "./config";
import * as middleware from "./middleware";
import { MiddlewareHandler, MiddlewareOptions, Provider } from "./options";
import promiseback from "./utils/promiseback";

type ActivatorMiddleware = (
  req: ConnectIncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => unknown;

const MIDDLEWARE_FACTORIES: Record<
  string,
  middleware.MiddlewareFactory<MiddlewareOptions>
> = {
  protect: middleware.protect,
  redirects: middleware.redirects,
  headers: middleware.headers,
  env: middleware.env,
  files: middleware.files,
  rewrites: middleware.rewrites,
  missing: middleware.missing,
};

class Activator {
  spec: activator.ActivatorOptions;
  provider?: Provider;
  stack: ActivatorMiddleware[];
  awaitConfig: activator.ConfigLoader;

  constructor(spec: activator.ActivatorOptions, provider?: Provider) {
    this.spec = spec;
    this.provider = provider;
    this.stack = this.buildStack();

    if (typeof spec.config === "function") {
      this.awaitConfig = spec.config;
    } else {
      const staticConfig = spec.config;
      this.awaitConfig = (): Promise<activator.ConfigValue> =>
        Promise.resolve(staticConfig);
    }
  }

  buildStack(): ActivatorMiddleware[] {
    const stack: (string | MiddlewareHandler)[] = Array.isArray(this.spec.stack)
      ? this.spec.stack.slice(0)
      : [];

    Object.entries(this.spec.before ?? {}).forEach(([name, wares]) => {
      const items = Array.isArray(wares) ? wares : [wares];
      stack.splice(stack.indexOf(name), 0, ...items);
    });

    Object.entries(this.spec.after ?? {}).forEach(([name, wares]) => {
      const items = Array.isArray(wares) ? wares : [wares];
      stack.splice(stack.indexOf(name) + 1, 0, ...items);
    });

    return stack.map((ware) => {
      if (typeof ware === "function") {
        // Activator invokes request middlewares (2/3 args), not 4-arg error handlers.
        return ware as ActivatorMiddleware;
      }
      const factory = Object.hasOwn(MIDDLEWARE_FACTORIES, ware)
        ? MIDDLEWARE_FACTORIES[ware]
        : undefined;
      if (!factory) {
        throw new TypeError(`Unknown middleware "${ware}"`);
      }
      return factory(this.spec as MiddlewareOptions) as ActivatorMiddleware;
    });
  }

  build(): NextHandleFunction {
    return (
      req: ConnectIncomingMessage & { superstatic?: Configuration },
      res: ServerResponse,
      next: NextFunction,
    ): void => {
      const loadConfig = promiseback<
        [ConnectIncomingMessage, ServerResponse],
        activator.ConfigValue
      >(this.awaitConfig, 2);

      Promise.resolve(loadConfig(req, res))
        .then((config) => {
          req.superstatic =
            typeof config === "object" && config !== null ? config : {};

          const stack = this.stack.slice(0).reverse();
          const _run = (err?: unknown): void => {
            if (err) {
              next(err);
              return;
            }
            const fn = stack.pop();
            if (!fn) {
              next();
              return;
            }
            fn(req, res, _run);
          };

          _run();
        })
        .catch((err: unknown) => {
          next(err);
        });
    };
  }
}

/**
 * Creates middleware that resolves per-request configuration and runs the configured middleware stack.
 * @param spec superstatic middleware and stack options.
 * @param provider optional file provider instance.
 * @returns Connect middleware function.
 */
function activator(
  spec: activator.ActivatorOptions,
  provider?: Provider,
): NextHandleFunction {
  return new Activator(spec, provider).build();
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace activator {
  export type ConfigValue = Configuration | string | undefined;

  export type ConfigLoader =
    | ((
        req: ConnectIncomingMessage,
        res: ServerResponse,
      ) => ConfigValue | Promise<ConfigValue>)
    | ((
        req: ConnectIncomingMessage,
        res: ServerResponse,
        callback: (err?: unknown, config?: ConfigValue) => void,
      ) => void);

  export type ActivatorOptions = Omit<MiddlewareOptions, "config" | "stack"> & {
    config?: ConfigValue | ConfigLoader;
    stack?: string | (string | MiddlewareHandler)[];
  };
}

export = activator;
