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
import { FileStats, Provider, ProviderResult } from "../options";

/**
 * Creates an in-memory file provider backed by a key-value map.
 * @param options provider configuration options.
 * @returns provider function with an attached `store` map.
 */
function memoryProvider(
  options: memoryProvider.MemoryProviderOptions = {},
): memoryProvider.MemoryProvider {
  const fn = (
    req: unknown,
    pathname: string,
  ): Promise<memoryProvider.MemoryProviderResult | null> => {
    let decodedPathname: string;
    try {
      decodedPathname = decodeURI(pathname);
    } catch {
      return Promise.resolve(null);
    }

    const currentStore = fn.store ?? {};
    const content = Object.hasOwn(currentStore, decodedPathname)
      ? currentStore[decodedPathname]
      : undefined;

    if (typeof content !== "string" || !content) {
      return Promise.resolve(null);
    }

    const buf = Buffer.from(content, "utf8");
    const stream = Readable.from(buf);
    const etag = crypto.createHash("md5").update(buf).digest("hex");

    return Promise.resolve({
      modified: options.modified ?? null,
      stream,
      size: buf.byteLength,
      etag,
    });
  };

  fn.store = options.store ?? {};
  return fn;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace memoryProvider {
  export interface MemoryProviderOptions {
    store?: Record<string, string>;
    modified?: FileStats["modified"];
  }

  export interface MemoryProviderResult extends ProviderResult {
    modified: Exclude<FileStats["modified"], undefined>;
    stream: Readable;
    size: number;
    etag: string;
  }

  export interface MemoryProvider extends Provider {
    (req: unknown, pathname: string): Promise<MemoryProviderResult | null>;
    store: Record<string, string>;
  }
}

export = memoryProvider;
