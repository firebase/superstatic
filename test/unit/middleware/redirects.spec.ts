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

import { expect } from "chai";
import connect from "connect";
import { ServerResponse } from "node:http";
import { Readable } from "node:stream";
import sinon from "sinon";
import request from "supertest";

import superstatic from "../../../src";
import { Redirect } from "../../../src/config";
import redirectsPkg from "../../../src/middleware/redirects";
import Responder from "../../../src/responder";
import * as patterns from "../../../src/utils/patterns";
import * as helpers from "../../helpers";

type ResponderConstructor = new (
  req: connect.IncomingMessage,
  res: ServerResponse,
  options: { provider: Record<string, unknown> },
) => unknown;

const ResponderClass = Responder as unknown as ResponderConstructor;
const redirect = helpers.decorator(redirectsPkg);

const superstaticSetup: connect.NextHandleFunction = (
  req,
  res: ServerResponse & { superstatic?: unknown },
  next,
) => {
  res.superstatic = new ResponderClass(req, res, { provider: {} });
  next();
};

describe("redirect middleware", () => {
  it("skips the middleware if redirects config is omitted", async () => {
    const app = connect().use(redirect({}));

    await request(app).get("/").expect(404);
  });

  it("skips the middleware if there are no redirects configured", async () => {
    const app = connect().use(redirect({ redirects: [] }));

    await request(app).get("/").expect(404);
  });

  it("throws when redirects are provided in an unrecognized format", async () => {
    const app = connect().use(
      redirect({ redirects: "invalid" as unknown as Redirect[] }),
    );

    await request(app).get("/").expect(500);
  });

  it("skips middleware when there are no matching redirects", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/source",
              destination: "/redirect",
              type: 301,
            },
          ],
        }),
      );

    await request(app).get("/none").expect(404);
  });

  it("redirects to a configured path", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/source",
              destination: "/redirect",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/source")
      .expect(301)
      .expect("location", "/redirect");
  });

  it("defaults redirect status code to 301 when type is omitted", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/source",
              destination: "/redirect",
            },
          ],
        }),
      );

    await request(app)
      .get("/source")
      .expect(301)
      .expect("location", "/redirect");
  });

  it("recognizes glob as synonymous with source", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              glob: "/source",
              destination: "/redirect",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/source")
      .expect(301)
      .expect("location", "/redirect");
  });

  it("redirects to a configured regexp path", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              regex: "/source",
              destination: "/redirect",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/source")
      .expect(301)
      .expect("location", "/redirect");
  });

  it("redirects to a configured path with a custom status code", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/source",
              destination: "/redirect",
              type: 302,
            },
          ],
        }),
      );

    await request(app)
      .get("/source")
      .expect(302)
      .expect("location", "/redirect");
  });

  it("adds leading slash to all redirect paths", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "source",
              destination: "/redirect",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/source")
      .expect(301)
      .expect("location", "/redirect");
  });

  it("redirects using glob negation", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "!source",
              destination: "/redirect",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/anthing")
      .expect(301)
      .expect("location", "/redirect");
  });

  it("redirects using segments in the url path", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/old/:value/path/:loc",
              destination: "/new/:value/path/:loc",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/old/redirect/path/there")
      .expect(301)
      .expect("location", "/new/redirect/path/there");
  });

  it("uses capturing groups as segments when given a regex", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              regex: "/old/(.+)/group/(.+)",
              destination: "/new/:1/path/:2",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/old/capture/group/there")
      .expect(301)
      .expect("location", "/new/capture/path/there");
  });

  it("handles Unicode codepoints in regexes", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              regex: "/äöü",
              destination: "/aou",
              type: 301,
            },
          ],
        }),
      );

    await request(app).get("/äöü").expect(301).expect("location", "/aou");
  });

  it("percent encodes the redirect location", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              regex: "/aou",
              destination: "/ć",
              type: 301,
            },
          ],
        }),
      );

    await request(app).get("/aou").expect(301).expect("location", "/%C4%87");
  });

  it("redirects using regexp captures inside path segments", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              regex: "/foo/(.+)bar/baz",
              destination: "/:1",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/foo/barbar/baz")
      .expect(301)
      .expect("location", "/bar");
  });

  it("redirects using regexp captures across path segments", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              regex: "/foo/(.+)/bar",
              destination: "/:1",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/foo/1/2/3/4/bar")
      .expect(301)
      .expect("location", "/1/2/3/4");
  });

  if (patterns.re2Available()) {
    it("redirects using RE2 capturing groups", async () => {
      const app = connect()
        .use(superstaticSetup)
        .use(
          redirect({
            redirects: [
              {
                regex: "/(?P<asdf>foo)/bar",
                destination: "/:asdf",
                type: 301,
              },
            ],
          }),
        );

      await request(app).get("/foo/bar").expect(301).expect("location", "/foo");
    });

    it("redirects using both named and unnamed capture groups", async () => {
      const app = connect()
        .use(superstaticSetup)
        .use(
          redirect({
            redirects: [
              {
                regex: "/(?P<asdf>.+)/(.+)/(?P<jkl>.+)",
                destination: "/:asdf/:2/:jkl",
                type: 301,
              },
            ],
          }),
        );

      await request(app)
        .get("/mixed/capture/types")
        .expect(301)
        .expect("location", "/mixed/capture/types");
    });
  }

  it("redirects a missing optional segment", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/old/:value?",
              destination: "/new/:value?",
              type: 301,
            },
          ],
        }),
      );

    await request(app).get("/old/").expect(301).expect("location", "/new");
  });

  it("redirects a present optional segment", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/old/:value?",
              destination: "/new/:value?",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/old/derp")
      .expect(301)
      .expect("location", "/new/derp");
  });

  it("redirects a splat segment", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/blog/:post*",
              destination: "/new/:post*",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/blog/this/old/post")
      .expect(301)
      .expect("location", "/new/this/old/post");
  });

  it("redirects using segments in the url path with a 302", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/old/:value/path/:loc",
              destination: "/new/:value/path/:loc",
              type: 302,
            },
          ],
        }),
      );

    await request(app)
      .get("/old/redirect/path/there")
      .expect(302)
      .expect("location", "/new/redirect/path/there");
  });

  it("redirects to external http url", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/source",
              destination: "http://redirectedto.com",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/source")
      .expect(301)
      .expect("Location", "http://redirectedto.com");
  });

  it("redirects to external https url", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/source",
              destination: "https://redirectedto.com",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/source")
      .expect(301)
      .expect("Location", "https://redirectedto.com");
  });

  it("strips leading slash before external protocol url", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/source",
              destination: "/https:/redirectedto.com",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/source")
      .expect(301)
      .expect("Location", "https://redirectedto.com");
  });

  it("preserves query params when redirecting", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/source",
              destination: "/destination",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/source?foo=bar&baz=qux")
      .expect(301)
      .expect("Location", "/destination?foo=bar&baz=qux");
  });

  it("appends query params to the destination when redirecting", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/source",
              destination: "/destination?hello=world",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/source?foo=bar&baz=qux")
      .expect(301)
      .expect("Location", "/destination?hello=world&foo=bar&baz=qux");
  });

  it("preserves query params when redirecting to external urls", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/source",
              destination: "http://example.com/destination",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/source?foo=bar&baz=qux")
      .expect(301)
      .expect("Location", "http://example.com/destination?foo=bar&baz=qux");
  });

  it("preserves query params when redirecting with captures", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/source/:foo",
              destination: "/:foo/bar",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/source/wat?foo=bar&baz=qux")
      .expect(301)
      .expect("Location", "/wat/bar?foo=bar&baz=qux");
  });

  it("skips redirect when destination compilation fails", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              regex: "/old/foo",
              destination: "/new/:missing",
              type: 301,
            },
          ],
        }),
      );

    await request(app).get("/old/foo").expect(404);
  });

  it("passes an error to next when redirects are provided in an unrecognized format", async () => {
    let capturedError: Error | undefined;
    const app = connect()
      .use(redirect({ redirects: "invalid" as unknown as Redirect[] }))
      .use(
        (
          err: Error,
          _req: connect.IncomingMessage,
          res: ServerResponse,
          next: connect.NextFunction,
        ) => {
          void next;
          capturedError = err;
          res.statusCode = 500;
          res.end(err.message);
        },
      );

    await request(app)
      .get("/")
      .expect(500, "redirects provided in an unrecognized format");
    expect(capturedError?.message).to.equal(
      "redirects provided in an unrecognized format",
    );
  });

  it("skips middleware when request url has malformed percent-encoding", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/source",
              destination: "/redirect",
              type: 301,
            },
          ],
        }),
      );

    await request(app).get("/foo%bar").expect(404);
  });

  it("preserves query strings containing additional question marks", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/source",
              destination: "/destination",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/source?redirect=https://example.com?foo=bar")
      .expect(301)
      .expect("Location", "/destination?redirect=https://example.com?foo=bar");
  });

  it("caches compiled redirects across requests with the same config reference", async () => {
    const createRawSpy = sinon.spy(patterns, "createRaw");
    try {
      const redirectsConfig: Redirect[] = [
        {
          regex: "^/old/(?<item>[^/]+)$",
          destination: "/new/:item",
          type: 301,
        },
      ];
      const middleware = redirectsPkg();
      const app = connect()
        .use((req, res, next) => {
          Object.assign(req, { superstatic: { redirects: redirectsConfig } });
          superstaticSetup(req, res, next);
        })
        .use(middleware);

      await request(app)
        .get("/old/one")
        .expect(301)
        .expect("Location", "/new/one");
      await request(app)
        .get("/old/two")
        .expect(301)
        .expect("Location", "/new/two");

      expect(createRawSpy.callCount).to.equal(1);
    } finally {
      createRawSpy.restore();
    }
  });

  it("propagates an error rather than failing open when mounted in superstatic with invalid redirects", async () => {
    let capturedError: Error | undefined;
    const app = connect()
      .use(
        superstatic({
          fallthrough: false,
          provider: () => ({
            stream: Readable.from("static content"),
          }),
          config: {
            redirects: "invalid" as unknown as Redirect[],
          },
        }),
      )
      .use(
        (
          err: Error,
          _req: connect.IncomingMessage,
          res: ServerResponse,
          next: connect.NextFunction,
        ) => {
          void next;
          capturedError = err;
          res.statusCode = 500;
          res.end(err.message);
        },
      );

    await request(app)
      .get("/")
      .expect(500, "redirects provided in an unrecognized format");
    expect(capturedError?.message).to.equal(
      "redirects provided in an unrecognized format",
    );
  });

  it("redirects requests with raw percent characters in query parameters", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/source",
              destination: "/destination",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/source?discount=50%")
      .expect(301)
      .expect("Location", "/destination?discount=50%");

    await request(app)
      .get("/source?%")
      .expect(301)
      .expect("Location", "/destination?%");
  });

  it("does not double-encode already percent-encoded query parameters", async () => {
    const app = connect()
      .use(superstaticSetup)
      .use(
        redirect({
          redirects: [
            {
              source: "/source",
              destination: "/destination",
              type: 301,
            },
            {
              source: "/captured/:foo",
              destination: "/:foo/bar",
              type: 301,
            },
          ],
        }),
      );

    await request(app)
      .get("/source?filter=a%26b")
      .expect(301)
      .expect("Location", "/destination?filter=a%26b");

    await request(app)
      .get("/source?redirect=%3A8080")
      .expect(301)
      .expect("Location", "/destination?redirect=%3A8080");

    await request(app)
      .get("/captured/wat?filter=a%26b")
      .expect(301)
      .expect("Location", "/wat/bar?filter=a%26b");
  });

  it("accepts middleware options in factory and attaches to connect directly", async () => {
    const middleware = redirectsPkg({ fallthrough: false });
    const app = connect()
      .use((req, res, next) => {
        Object.assign(req, {
          superstatic: {
            redirects: [
              {
                source: "/source",
                destination: "/destination",
                type: 301,
              },
            ],
          },
        });
        superstaticSetup(req, res, next);
      })
      .use(middleware);

    await request(app)
      .get("/source")
      .expect(301)
      .expect("Location", "/destination");
  });

  it("passes an error to next when a redirect matches without responder initialized", async () => {
    let capturedError: Error | undefined;
    const app = connect()
      .use(
        redirect({
          redirects: [
            {
              source: "/source",
              destination: "/redirect",
              type: 301,
            },
          ],
        }),
      )
      .use(
        (
          err: Error,
          _req: connect.IncomingMessage,
          res: ServerResponse,
          next: connect.NextFunction,
        ) => {
          void next;
          capturedError = err;
          res.statusCode = 500;
          res.end(err.message);
        },
      );

    await request(app)
      .get("/source")
      .expect(500, "Responder middleware is not initialized");
    expect(capturedError?.message).to.equal(
      "Responder middleware is not initialized",
    );
  });
});
