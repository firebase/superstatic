# Changelog

## [2.1.0](https://github.com/divshot/superstatic/issues?q=is%3Aissue+milestone%3A2.1+is%3Aclosed)

**Released on 2-4-2015**

* **[#41](https://github.com/divshot/superstatic/issues/41)** - etag support
* **[#123](https://github.com/divshot/superstatic/issues/123)** - Support for live reload
* **[#132](https://github.com/divshot/superstatic/issues/132)** - Using services in local development
* **[#134](https://github.com/divshot/superstatic/issues/134)** - lodash 3.x.x
* **[#135](https://github.com/divshot/superstatic/issues/135)** - export Server as a value not a path

### Breaking Changes

* The server is now available as a properting on the Superstatic object (instead of through a require path). See [#135](https://github.com/divshot/superstatic/issues/135).
* You no longer need to use the `--services` flag to use services locally. Superstatic checks your local and global modules for the Superstatic services and installs them automatically if they are missing.

## 2.0.2

**Released on 1-30-2015**

* Fixes bug that ignored divshot.json configuration files

## [2.0.1](https://github.com/divshot/superstatic/issues?q=is%3Aissue+milestone%3A2.0.1+is%3Aclosed)

**Released on 1-29-2015**

* **[#137](https://github.com/divshot/superstatic/issues/137)** - default environment variables file to .env.json
* **[#138](https://github.com/divshot/superstatic/issues/138)** - fix serving static files with query parameters

## [2.0.0](https://github.com/divshot/superstatic/issues?q=is%3Aopen+is%3Aissue+milestone%3A2.0)

**Released on 1-26-2015**

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

