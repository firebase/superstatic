#!/usr/bin/env node

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

var updateNotifier = require('update-notifier');
var format = require('chalk');

var cli = require('../cli');
var pkg = require('../../package.json');

var updateCheckInterval = 1000 * 60 * 60 * 24 * 7; // 1 week

var notifier = updateNotifier({
  pkg,
  updateCheckInterval: 1,
  shouldNotifyInNpmScript: true,
});

const updateMessage =
  `Update available ${format.gray("{currentVersion}")} → ${format.green("{latestVersion}")}\n` +
  `To update to the latest version using npm, run\n${format.cyan("npm install -g superstatic")}` +
notifier.notify({ defer: true, isGlobal: true });

cli.parseAsync();