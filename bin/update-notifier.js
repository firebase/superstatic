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

const compare = require("compare-semver");
const format = require("chalk");
const stringLength = require("string-length");

module.exports = function (pkg) {
  if (compare.gt(pkg.current, [pkg.latest])) {
    return;
  }

  let msg = [
    format.bold.yellow("A new version of Superstatic is available"),
    "",
    "Your current version is " + format.green.bold(pkg.current) + ".",
    "The latest version is " + format.green.bold(pkg.latest) + ".",
    "",
    "Run " + format.bold.yellow("npm install superstatic -g") + " to update.",
  ];

  let contentWidth = 0;
  msg = msg.map((line) => {
    return "  " + line; // + format.yellow('│');
  });

  msg.forEach((line) => {
    if (stringLength(line) > contentWidth) {
      contentWidth = stringLength(line);
    }
  });

  const fill = function (str, count) {
    return Array(count + 1).join(str);
  };

  const top = format.yellow("┌" + fill("─", contentWidth) + "┐");
  const bottom = format.yellow("└" + fill("─", contentWidth) + "┘");

  console.log("");
  console.log(top);
  console.log(msg.join("\n"));
  console.log(bottom);
  console.log("");
};
