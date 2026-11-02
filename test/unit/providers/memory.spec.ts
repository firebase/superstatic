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

import { use, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import memoryProvider, { MemoryProvider } from "../../../src/providers/memory";

use(chaiAsPromised);

describe("memory provider", () => {
  let store: Record<string, string>;
  let provider: MemoryProvider;

  beforeEach(() => {
    store = {};
    provider = memoryProvider({ store });
  });

  it("should resolve null if not in the store", () => {
    return expect(provider({}, "/whatever")).to.eventually.be.null;
  });

  it("should return a stream of the content if found", async () => {
    store["/index.html"] = "foobar";

    const result = await provider({}, "/index.html");
    expect(result).to.not.equal(null);
    if (!result) {
      throw new Error("expected provider result");
    }

    const out = await new Promise<string>((resolve, reject) => {
      let data = "";
      result.stream.on("error", reject);
      result.stream.on("data", (chunk: Buffer | string) => {
        data += chunk.toString();
      });
      result.stream.on("end", () => {
        resolve(data);
      });
    });
    expect(out).to.eq("foobar");
  });

  it("should return an etag of the content", async () => {
    store["/a.html"] = "foo";
    store["/b.html"] = "bar";

    const [a, b] = await Promise.all([
      provider({}, "/a.html"),
      provider({}, "/b.html"),
    ]);

    expect(a).to.not.equal(null);
    expect(b).to.not.equal(null);
    expect(a?.etag).to.be.a("string");
    expect(b?.etag).to.be.a("string");
    expect(a?.etag).to.not.eq(b?.etag);
  });

  it("should return the length of content", () => {
    store["/index.html"] = "foobar";
    return expect(provider({}, "/index.html")).to.eventually.have.property(
      "size",
      6,
    );
  });

  it("should expose the backing store on the provider function", async () => {
    const defaultProvider = memoryProvider();
    defaultProvider.store["/default.html"] = "hello";

    expect(provider.store).to.equal(store);
    const result = await defaultProvider({}, "/default.html");
    expect(result).to.not.equal(null);
    expect(result?.size).to.equal(5);
    expect(result?.modified).to.equal(null);
  });

  it("should include modified timestamp when configured", async () => {
    const modified = 1700000000000;
    const datedProvider = memoryProvider({
      store: { "/dated.html": "content" },
      modified,
    });

    const result = await datedProvider({}, "/dated.html");
    expect(result?.modified).to.equal(modified);
  });

  it("should decode URI-encoded pathnames", async () => {
    store["/hello world.html"] = "decoded";

    const result = await provider({}, "/hello%20world.html");
    expect(result?.size).to.equal(7);
  });
});
