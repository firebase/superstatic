# Changelog

## [2.0.0](https://github.com/divshot/superstatic/issues?q=is%3Aopen+is%3Aissue+milestone%3A2.0)

* **[#125](https://github.com/divshot/superstatic/issues/127)** - Middleware-ize Superstatic
* **[#127](https://github.com/divshot/superstatic/issues/125)** - Add changelog

### Breaking Changes

* **CLI**
  * Network stdout is off by default. To enable, use the `--debug` flag to enable.
  * `--quiet` flag has been removed in favor of `--debug`
  * Gzip is off by default. Use the `--gzip` flag to enable.
* **API**
  * By default, Superstatic is a middleware now for an Express/Connect or barebones Node server. See the [API docs]() for more info on options for the middleware
  * Since Superstatic gets required as a middleware by default now, this means that if you want Superstatic as a standalone server via the API, then you need to require the server via `var server = require('superstatic/lib/server');`. See the [API docs]() for options when instantiating the server.
  * `logger` options on server is no longer available. Since Superstatic can be required as a middleware and debug is off by default, you can inject your own logger.
  * `localEnv` is now `env` in middleware/server options
  * Server methods `listen()` and `close()` now behave like the bare/default Node http server methods.


* * *

(For releases previous to **2.0.0**, see [releases](https://github.com/divshot/superstatic/releases))

