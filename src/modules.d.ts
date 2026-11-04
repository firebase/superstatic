/**
 * Copyright (c) 2026 Google LLC
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

declare module "basic-auth-connect" {
  import connect from "connect";

  function basicAuth(
    user: string,
    pass: string,
    realm?: string,
  ): connect.NextHandleFunction;
  function basicAuth(
    callback: (user: string, pass: string) => boolean,
    realm?: string,
  ): connect.NextHandleFunction;

  export = basicAuth;
}

declare module "router" {
  import * as http from "node:http";
  import connect from "connect";

  interface Router extends connect.NextHandleFunction {
    use(...handlers: connect.HandleFunction[]): this;
    use(route: string, ...handlers: connect.HandleFunction[]): this;
    handle(
      req: http.IncomingMessage,
      res: http.ServerResponse,
      callback: connect.NextFunction,
    ): void;
  }

  function createRouter(options?: Record<string, unknown>): Router;

  export = createRouter;
}

declare module "update-notifier-cjs" {
  interface UpdateNotifierOptions {
    pkg: {
      name: string;
      version: string;
    };
    updateCheckInterval?: number;
    shouldNotifyInNpmScript?: boolean;
  }

  interface UpdateNotifier {
    notify(): void;
  }

  function updateNotifier(options: UpdateNotifierOptions): UpdateNotifier;

  export = updateNotifier;
}
