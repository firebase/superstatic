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

export interface Configuration {
  // Defaults to the current working directory.
  public?: string | string[];
  cleanUrls?: boolean | string[];
  rewrites?: Rewrite[];
  redirects?: Redirect[];
  headers?: Header[];
  trailingSlash?: boolean;
  i18n?: { root: string };
  errorPage?: string;
  env?: Record<string, string>;
  protect?: string;
}

export type Matcher =
  | { source: string; glob?: string; regex?: string }
  | { source?: string; glob: string; regex?: string }
  | { source?: string; glob?: string; regex: string };

export type RewriteTarget =
  | { destination: string }
  | {
      function:
        string | { functionId: string; region?: string; pinTag?: boolean };
    }
  | { run: { serviceId: string; region?: string; pinTag?: boolean } }
  | { dynamicLinks: boolean }
  | ({ destination?: string } & Record<string, unknown>);

export type Rewrite = Matcher & RewriteTarget;

export type Redirect = Matcher & {
  destination: string;
  type?: number;
};

export type Header = Matcher & {
  headers: {
    key: string;
    value: string;
  }[];
};
