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

import * as crypto from "node:crypto";
import { Readable } from "node:stream";

/**
 * Creates an in-memory file provider backed by a key-value map.
 * @param options provider configuration options.
 * @returns provider function with an attached `store` map.
 */
function memoryProvider(
  options: memoryProvider.MemoryProviderOptions = {},
): memoryProvider.MemoryProvider {
  const store: Record<string, string> = options.store ?? {};

  const fn = (
    req: unknown,
    pathname: string,
  ): Promise<memoryProvider.MemoryProviderResult | null> => {
    const decodedPathname = decodeURI(pathname);
    const content = Object.hasOwn(store, decodedPathname)
      ? store[decodedPathname]
      : undefined;

    if (content === undefined) {
      return Promise.resolve(null);
    }

    const stream = new Readable();
    stream.push(content);
    stream.push(null);

    const hash = crypto.createHash("md5");
    hash.update(content);

    return Promise.resolve({
      modified: options.modified ?? null,
      stream,
      size: content.length,
      etag: hash.digest("hex"),
    });
  };

  fn.store = store;
  return fn;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace memoryProvider {
  export interface MemoryProviderOptions {
    store?: Record<string, string>;
    modified?: number | Date | null;
  }

  export interface MemoryProviderResult {
    modified: number | Date | null;
    stream: Readable;
    size: number;
    etag: string;
  }

  export interface MemoryProvider {
    (req: unknown, pathname: string): Promise<MemoryProviderResult | null>;
    store: Record<string, string>;
  }
}

export = memoryProvider;
