/**
 * Copyright (c) 2026 Google LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { ServerResponse } from "node:http";
import { Readable } from "node:stream";
import connect, { HandleFunction } from "connect";
import { Configuration } from "./config";
import Responder from "./responder";

export interface FileStats {
  modified?: number | string | Date | null;
  size?: number;
  etag?: string;
  contentType?: string;
}

export interface ProviderResult extends FileStats {
  stream: Readable;
}

export type Provider = (
  req: connect.IncomingMessage & { superstatic?: Configuration },
  pathname: string,
) =>
  | Promise<ProviderResult | null | undefined>
  | ProviderResult
  | null
  | undefined;

export interface FileDirective {
  file: string;
  status?: number;
}

export interface RedirectDirective {
  redirect: string;
  status?: number;
}

export interface RewriteConfig {
  source?: string;
  glob?: string;
  regex?: string;
  destination?: string;
  function?: string | { functionId: string; region?: string; pinTag?: boolean };
  run?: { serviceId: string; region?: string; pinTag?: boolean };
  dynamicLinks?: boolean;
  [key: string]: unknown;
}

export interface RewriteDirective {
  rewrite: RewriteConfig;
}

export interface DataDirective {
  data: string | Uint8Array;
  status?: number;
  contentType?: string;
}

export type ResponderMiddleware = (
  req: connect.IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => unknown;

export type ResponderDirective =
  | FileDirective
  | RedirectDirective
  | RewriteDirective
  | DataDirective
  | ResponderMiddleware
  | string
  | ResponderDirective[];

export type RewriterFunction = (
  rewrite: RewriteConfig,
  responder: Responder,
) => Promise<ResponderDirective>;

export interface MiddlewareOptions {
  fallthrough?: boolean;
  config?: string | Configuration;
  protect?: string;
  env?: Record<string, string>;
  cwd?: string;
  compression?: boolean | HandleFunction;
  stack?: string | string[];
  after?: Record<string, HandleFunction | HandleFunction[]>;
  before?: Record<string, HandleFunction | HandleFunction[]>;
  rewriters?: Record<string, RewriterFunction>;
  provider?: Provider;
  allowedHeaders?: string[];
  errorPage?: string;
}

export interface ServerOptions extends MiddlewareOptions {
  port?: number;
  hostname?: string;
  errorPage?: string;
  debug?: boolean;
  compression?: boolean | HandleFunction;
}

export interface SuperstaticRequest extends connect.IncomingMessage {
  superstatic: Configuration;
}

export interface SuperstaticResponse extends ServerResponse {
  superstatic: Responder;
}
