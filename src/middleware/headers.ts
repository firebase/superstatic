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

import {
  IncomingMessage as ConnectIncomingMessage,
  NextFunction,
} from "connect";
import { ServerResponse } from "node:http";
import onHeaders from "on-headers";

import { Configuration, Header } from "../config";
import { slasher } from "../utils/pathutils";
import * as patterns from "../utils/patterns";

type Responder = import("../responder");

const ABSOLUTE_URI_RE = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//;

interface HeaderValue {
  key: string;
  value: string;
}

function normalizedConfigHeaders(
  spec: { allowedHeaders?: string[] },
  config: Header[],
): Header[] {
  if (!Array.isArray(config)) {
    return [];
  }

  const allowedHeaders = spec.allowedHeaders;
  return config.map((entry) => {
    const rawHeaders = Array.isArray(entry.headers) ? entry.headers : [];
    const filteredHeaders = allowedHeaders
      ? rawHeaders.filter(
          (headerToSet) =>
            Boolean(headerToSet?.key) &&
            allowedHeaders.includes(headerToSet.key.toLowerCase()),
        )
      : rawHeaders;

    return {
      ...entry,
      headers: filteredHeaders,
      ...(typeof entry.source === "string"
        ? { source: slasher(entry.source) }
        : {}),
      ...(typeof entry.glob === "string" ? { glob: slasher(entry.glob) } : {}),
    };
  });
}

function matcher(configHeaders: Header[]): (url: string) => HeaderValue[] {
  return function (url: string): HeaderValue[] {
    return configHeaders
      .filter((configHeader) => patterns.configMatcher(url, configHeader))
      .flatMap((val) => val.headers);
  };
}

function extractPathname(url?: string): string {
  const rawUrl = url ?? "/";
  if (ABSOLUTE_URI_RE.test(rawUrl)) {
    try {
      return slasher(new URL(rawUrl).pathname);
    } catch {
      // Fall through to raw path splitting.
    }
  }
  const rawPath = rawUrl.split(/[?#]/, 1)[0] ?? "";
  return slasher(rawPath === "" ? "/" : rawPath);
}

/**
 * Returns middleware for setting configured custom HTTP headers.
 * @param spec superstatic options.
 * @param spec.allowedHeaders optional allowlist of lowercase header names.
 * @returns middleware.
 */
function headers(
  spec: { allowedHeaders?: string[] } = {},
): (
  req: ConnectIncomingMessage & { superstatic?: Configuration },
  res: ServerResponse & { superstatic?: Responder },
  next: NextFunction,
) => void {
  return function (
    req: ConnectIncomingMessage & { superstatic?: Configuration },
    res: ServerResponse & { superstatic?: Responder },
    next: NextFunction,
  ): void {
    const config: Configuration["headers"] = req.superstatic?.headers;
    if (!config) {
      next();
      return;
    }

    const headerMatcher = matcher(normalizedConfigHeaders(spec, config));
    const pathname = extractPathname(req.url);
    const matches = headerMatcher(pathname);

    onHeaders(res, () => {
      matches.forEach((header) => {
        res.setHeader(header.key, header.value);
      });
    });

    next();
  };
}

export = headers;
