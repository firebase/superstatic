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
import { stat as fsStat } from "node:fs/promises";
import * as fs from "node:fs";
import * as path from "node:path";

import { Provider, ProviderResult } from "../options";

async function multiStat(
  paths: string[],
): Promise<fs.Stats & { pathname: string }> {
  let err: unknown = new Error("No paths provided to multiStat");
  for (const pathname of paths) {
    try {
      const stat = await fsStat(pathname);
      return { pathname, ...stat };
    } catch (e: unknown) {
      err = e;
    }
  }
  throw err;
}

/**
 * Creates a filesystem-backed file provider.
 * @param options provider configuration options.
 * @returns provider lookup function.
 */
function fsProvider(
  options: fsProvider.FsProviderOptions = {},
): fsProvider.FsProvider {
  const etagCache: Record<string, { timestamp: number; value: string }> = {};
  const cwd = options.cwd ?? process.cwd();
  const rawPublic = options.public ?? ["."];
  const publicPaths: string[] = Array.isArray(rawPublic)
    ? rawPublic
    : [rawPublic];

  async function fetchEtag(pathname: string, stat: fs.Stats): Promise<string> {
    return new Promise((resolve, reject) => {
      const mtime = stat.mtime?.getTime() ?? stat.mtimeMs;
      const cached = etagCache[pathname];
      if (cached?.timestamp === mtime) {
        return resolve(cached.value);
      }

      // the file you want to get the hash
      const fd = fs.createReadStream(pathname);
      const hash = crypto.createHash("md5");
      hash.setEncoding("hex");

      fd.on("error", reject);

      fd.on("end", () => {
        hash.end();
        const rawEtag: unknown = hash.read();
        const etag = typeof rawEtag === "string" ? rawEtag : "";
        etagCache[pathname] = {
          timestamp: mtime,
          value: etag,
        };
        resolve(etag);
      });

      // read all file and pipe it (write it) to the hash object
      return fd.pipe(hash);
    });
  }

  return async function (
    req: unknown,
    pathname: string,
  ): Promise<fsProvider.FsProviderResult | null> {
    pathname = decodeURI(pathname);
    // jumping to parent directories is not allowed
    if (
      pathname.includes("../") ||
      pathname.includes("..\\") ||
      pathname.toLowerCase().includes("..%5c") ||
      pathname.match(/\0/g) !== null ||
      // A path that didn't start with a slash is not valid.
      !pathname.startsWith("/")
    ) {
      return Promise.resolve(null);
    }

    const fullPathnames: string[] = publicPaths.map((p) =>
      path.join(cwd, p, pathname),
    );

    try {
      const stat = await multiStat(fullPathnames);
      return {
        // stat.mtime is gone in node.js v22, so transition over to mtimeMs.
        modified: stat.mtime?.getTime() ?? stat.mtimeMs,
        size: stat.size,
        etag: await fetchEtag(stat.pathname, stat),
        stream: fs.createReadStream(stat.pathname),
      };
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        typeof err.code === "string" &&
        ["ENOENT", "ENOTDIR", "EISDIR", "EINVAL"].includes(err.code)
      ) {
        return null;
      }
      if (err instanceof Error) {
        return Promise.reject(err);
      }
      return Promise.reject(new Error(`Unknown error: ${String(err)}`));
    }
  };
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace fsProvider {
  export interface FsProviderOptions {
    cwd?: string;
    public?: string | string[];
  }

  export interface FsProviderResult extends ProviderResult {
    modified: number;
    size: number;
    etag: string;
    stream: fs.ReadStream;
  }

  export type FsProvider = Provider &
    ((req: unknown, pathname: string) => Promise<FsProviderResult | null>);
}

export = fsProvider;
