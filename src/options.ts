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
import {
  HandleFunction,
  IncomingMessage as ConnectIncomingMessage,
} from "connect";
import { Configuration } from "./config";

type Responder = import("./responder");

export interface FileStats {
  modified?: number | string | Date | null;
  size?: number;
  etag?: string;
  contentType?: string;
}

export interface ProviderResult extends FileStats {
  stream: Readable;
}

export type ProviderCallback = (
  err: unknown,
  result?: ProviderResult | null,
) => void;

export type Provider = (
  req: ConnectIncomingMessage & { superstatic?: Configuration },
  pathname: string,
) =>
  | Promise<ProviderResult | null | undefined>
  | ProviderResult
  | null
  | undefined;

export type CallbackProvider = (
  req: ConnectIncomingMessage & { superstatic?: Configuration },
  pathname: string,
  callback: ProviderCallback,
) => void;

export interface FileDirective {
  file: string;
  status?: number | null;
}

export interface RedirectDirective {
  redirect: string;
  status?: number | null;
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
  status?: number | null;
  contentType?: string;
}

export type ResponderMiddleware = {
  bivarianceHack(
    req: ConnectIncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ): unknown;
}["bivarianceHack"];

export type ResponderDirective =
  | FileDirective
  | RedirectDirective
  | RewriteDirective
  | DataDirective
  | ResponderMiddleware
  | string
  | ResponderDirective[];

export type RewriterFunction = {
  bivarianceHack(
    rewrite: RewriteConfig,
    responder: Responder,
  ): Promise<ResponderDirective>;
}["bivarianceHack"];

export type MiddlewareHandler =
  | HandleFunction
  | {
      bivarianceHack(
        req: ConnectIncomingMessage,
        res: ServerResponse,
        next: (err?: unknown) => void,
      ): unknown;
    }["bivarianceHack"];

export interface MiddlewareOptions {
  fallthrough?: boolean;
  config?: string | string[] | Configuration;
  protect?: string;
  env?: Record<string, string>;
  cwd?: string;
  compression?: boolean | MiddlewareHandler;
  gzip?: boolean;
  stack?: string | string[];
  after?: Record<string, MiddlewareHandler | MiddlewareHandler[]>;
  before?: Record<string, MiddlewareHandler | MiddlewareHandler[]>;
  rewriters?: Record<string, RewriterFunction>;
  provider?: Provider | CallbackProvider;
  allowedHeaders?: string[];
  errorPage?: string;
}

export interface ServerOptions extends MiddlewareOptions {
  port?: number;
  hostname?: string;
  host?: string;
  errorPage?: string;
  debug?: boolean;
  compression?: boolean | MiddlewareHandler;
}

export interface SuperstaticRequest extends ConnectIncomingMessage {
  superstatic: Configuration;
}

export interface SuperstaticResponse extends ServerResponse {
  superstatic: Responder;
}
