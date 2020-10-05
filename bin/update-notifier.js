/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const compare = require("compare-semver");
const format = require("chalk");
const stringLength = require("string-length");

module.exports = function(pkg) {
  if (compare.gt(pkg.current, [pkg.latest])) {
    return;
  }

  let msg = [
    format.bold.yellow("A new version of Superstatic is available"),
    "",
    "Your current version is " + format.green.bold(pkg.current) + ".",
    "The latest version is " + format.green.bold(pkg.latest) + ".",
    "",
    "Run " + format.bold.yellow("npm install superstatic -g") + " to update."
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

  const fill = function(str, count) {
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
