# Changelog

## [2.2.0](https://github.com/divshot/superstatic/issues?q=milestone%3A2.2+is%3Aclosed)

**Released on 4-1-2015**

* **[#131](https://github.com/divshot/superstatic/issues/131)** - NEW - Configuration option to disable/enable trailing slashes
* **[#156](https://github.com/divshot/superstatic/issues/156)** - FIXED - High CPU usage with LiveReload enabled
* **[#159](https://github.com/divshot/superstatic/issues/159)**  - Update Nash to 2.x
* **[#162](https://github.com/divshot/superstatic/issues/162)** - FIXED - Automatic install of services doesn't try to instantiate missing service


## 2.1.3

**Released on 3-16-2015**

* **[#151](https://github.com/divshot/superstatic/issues/151)** - Fix flawed ETag when generating with fs.Stats instance

## 2.1.2

**Released on 3-5-2015**

* Fix rogue 404 when trying to serve directories
* Ensure compiled config object gets passed to middlewares instead of config file names

## [2.1.0](https://github.com/divshot/superstatic/issues?q=is%3Aissue+milestone%3A2.1+is%3Aclosed)

**Released on 2-24-2015**

* **[#41](https://github.com/divshot/superstatic/issues/41)** - NEW - etag support
* **[#123](https://github.com/divshot/superstatic/issues/123)** - NEW - Support for live reload
* **[#132](https://github.com/divshot/superstatic/issues/132)** - NEW - Using services in local development
* **[#134](https://github.com/divshot/superstatic/issues/134)** - PERF - lodash 3.x.x
* **[#135](https://github.com/divshot/superstatic/issues/135)** - Export Server as a value not a path
* **[#141](https://github.com/divshot/superstatic/issues/141)** - Test on Node 0.12 and io.js
* **[#146](https://github.com/divshot/superstatic/issues/146)** - FIXED - External Redirects
* **[#147](https://github.com/divshot/superstatic/issues/147)** - FIXED - Routes are not being used/get overwritten
* **[#150](https://github.com/divshot/superstatic/issues/150)** - NEW - Ensure order of routes

### Breaking Changes

* The server is now available as a property on the Superstatic object (instead of through a require path). See [#135](https://github.com/divshot/superstatic/issues/135).
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

