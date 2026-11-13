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

type Errback<Result> = (err?: unknown, res?: Result) => void;

type PromiseFn<Args extends unknown[], Result> = (
  ...args: Args
) => Promise<Result>;

type SyncOrPromiseFn<Args extends unknown[], Result> = (
  ...args: Args
) => Promise<Result> | Result;

type CallbackFn<Args extends unknown[], Result> = (
  ...args: [...Args, Errback<Result>]
) => void;

function formatUnknownError(err: unknown): string {
  if (typeof err === "string") {
    return err;
  }
  if (
    typeof err === "number" ||
    typeof err === "boolean" ||
    typeof err === "bigint" ||
    typeof err === "symbol"
  ) {
    return String(err);
  }
  try {
    const serialized: string | undefined = JSON.stringify(err);
    return serialized ?? Object.prototype.toString.call(err);
  } catch {
    return Object.prototype.toString.call(err);
  }
}

/**
 * Normalizes a Promise-returning or Node-style callback function into a Promise-returning function.
 * @param userFn function returning a Promise/value or accepting a trailing `(err, res)` callback.
 * @param argCount number of non-callback arguments expected by the Promise form.
 * @returns normalized function returning a Promise (or the original synchronous/Promise function).
 */
function promiseback<Args extends unknown[], Result>(
  userFn: PromiseFn<Args, Result>,
  argCount: number,
): PromiseFn<Args, Result>;
function promiseback<Args extends unknown[], Result>(
  userFn: CallbackFn<Args, Result>,
  argCount: number,
): PromiseFn<Args, Result>;
function promiseback<Args extends unknown[], Result>(
  userFn: SyncOrPromiseFn<Args, Result>,
  argCount: number,
): SyncOrPromiseFn<Args, Result>;
function promiseback<Args extends unknown[], Result>(
  userFn: SyncOrPromiseFn<Args, Result> | CallbackFn<Args, Result>,
  argCount: number,
): SyncOrPromiseFn<Args, Result>;
function promiseback<Args extends unknown[], Result>(
  userFn: SyncOrPromiseFn<Args, Result> | CallbackFn<Args, Result>,
  argCount: number,
): SyncOrPromiseFn<Args, Result> {
  // if no callback argument is provided, assume the promise form
  if (userFn.length <= argCount) {
    // Arity check guarantees userFn is the non-callback form at runtime.
    return userFn as SyncOrPromiseFn<Args, Result>;
  }
  // otherwise promise-ify the callback
  return (...args: Args): Promise<Result> => {
    return new Promise((resolve, reject) => {
      // Arity > argCount guarantees userFn expects a trailing errback at runtime.
      const callbackFn = userFn as CallbackFn<Args, Result>;
      callbackFn(...args, (err?: unknown, res?: Result) => {
        if (err) {
          if (err instanceof Error) {
            reject(err);
            return;
          }
          reject(new Error(`Unknown error: ${formatUnknownError(err)}`));
          return;
        }
        resolve(res as Result);
      });
    });
  };
}

export = promiseback;
