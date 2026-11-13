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

import { MiddlewareHandler, MiddlewareOptions } from "../options";
import envMiddleware from "./env";
import filesMiddleware from "./files";
import headersMiddleware from "./headers";
import missingMiddleware from "./missing";
import protectMiddleware from "./protect";
import redirectsMiddleware from "./redirects";
import rewritesMiddleware from "./rewrites";

export type NamedMiddleware<T extends MiddlewareHandler = MiddlewareHandler> =
  T & { _name: string };

export type MiddlewareFactory<
  Spec = MiddlewareOptions,
  T extends MiddlewareHandler = MiddlewareHandler,
> = (spec?: Spec, config?: unknown) => NamedMiddleware<T>;

function wrapMiddleware<Spec, T extends MiddlewareHandler>(
  name: string,
  factory: (spec?: Spec) => T,
): MiddlewareFactory<Spec, T> {
  return (spec?: Spec): NamedMiddleware<T> => {
    return Object.assign(factory(spec), { _name: name });
  };
}

/**
 * Returns HTTP Basic auth protection middleware tagged with `_name = "protect"`.
 */
export const protect = wrapMiddleware("protect", protectMiddleware);

/**
 * Returns redirects middleware tagged with `_name = "redirects"`.
 */
export const redirects = wrapMiddleware("redirects", redirectsMiddleware);

/**
 * Returns custom response headers middleware tagged with `_name = "headers"`.
 */
export const headers = wrapMiddleware("headers", headersMiddleware);

/**
 * Returns environment configuration middleware tagged with `_name = "env"`.
 */
export const env = wrapMiddleware("env", envMiddleware);

/**
 * Returns static file serving middleware tagged with `_name = "files"`.
 */
export const files = wrapMiddleware("files", filesMiddleware);

/**
 * Returns URL rewrite middleware tagged with `_name = "rewrites"`.
 */
export const rewrites = wrapMiddleware("rewrites", rewritesMiddleware);

/**
 * Returns 404 missing-page middleware tagged with `_name = "missing"`.
 */
export const missing = wrapMiddleware("missing", missingMiddleware);
