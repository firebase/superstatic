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

type PromiseFn<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => Promise<TResult>;

type CallbackFn<TArgs extends unknown[], TResult> = (
  ...args: [...TArgs, (err: unknown, res?: TResult) => void]
) => void;

/**
 * Wraps a function that may either return a Promise or accept a Node-style
 * callback as its final argument, normalizing it to always return a Promise.
 * @param userFn the function to wrap.
 * @param argCount the expected number of arguments when using the Promise form.
 * @returns a Promise-returning function.
 */
function promiseback<TArgs extends unknown[], TResult>(
  userFn: CallbackFn<TArgs, TResult>,
  argCount: number,
): PromiseFn<TArgs, TResult>;
function promiseback<TArgs extends unknown[], TResult>(
  userFn: PromiseFn<TArgs, TResult>,
  argCount: number,
): PromiseFn<TArgs, TResult>;
function promiseback<TArgs extends unknown[], TResult>(
  userFn: PromiseFn<TArgs, TResult> | CallbackFn<TArgs, TResult>,
  argCount: number,
): PromiseFn<TArgs, TResult> {
  // if no callback argument is provided, assume the promise form
  if (userFn.length <= argCount) {
    return userFn as PromiseFn<TArgs, TResult>;
  }
  // otherwise promise-ify the callback
  return (...args: TArgs): Promise<TResult> => {
    return new Promise((resolve, reject) => {
      (userFn as CallbackFn<TArgs, TResult>)(
        ...args,
        (err: unknown, res?: TResult) => {
          if (err) {
            if (err instanceof Error) {
              return reject(err);
            }
            const errMsg = typeof err === "string" ? err : JSON.stringify(err);
            return reject(new Error(`Unknown error: ${errMsg}`));
          }
          resolve(res as TResult);
        },
      );
    });
  };
}

export = promiseback;
