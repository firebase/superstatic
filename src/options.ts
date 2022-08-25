import { HandleFunction } from "connect";
import { Configuration } from "./config";

export interface MiddlewareOptions {
  fallthrough?: boolean;
  config?: string | Configuration;
  protect?: string;
  env?: string | Record<string, string>;
  cwd?: string;
  compression?: boolean;
  stack?: string | Array<string>;
  after?: Record<string, HandleFunction>;
  before?: Record<string, HandleFunction>;
  rewriters?: Record<string, unknown>;
}

export interface ServerOptions extends MiddlewareOptions {
  port?: number;
  host?: string;
  errorPage?: string;
  debug?: boolean;
  compression?: boolean;
}
