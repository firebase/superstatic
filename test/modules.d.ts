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

declare module "concat-stream" {
  interface StringConcatStreamOptions {
    encoding: "string";
  }

  interface BufferConcatStreamOptions {
    encoding?: BufferEncoding | "buffer" | "array" | "object";
  }

  function concatStream(
    opts: StringConcatStreamOptions,
    cb?: (body: string) => void,
  ): NodeJS.WritableStream;
  function concatStream(
    opts?: BufferConcatStreamOptions | ((body: Buffer) => void),
    cb?: (body: Buffer | unknown[]) => void,
  ): NodeJS.WritableStream;

  export = concatStream;
}

declare module "std-mocks" {
  export function use(opts?: {
    stdout?: boolean;
    stderr?: boolean;
    print?: boolean;
  }): void;

  export function restore(opts?: { stdout?: boolean; stderr?: boolean }): void;

  export function flush(opts?: { stdout?: boolean; stderr?: boolean }): {
    stdout?: string[];
    stderr?: string[];
  };
}
