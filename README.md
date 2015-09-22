# Superstatic   [![NPM Module](http://img.shields.io/npm/v/superstatic.svg?style=flat-square)](https://npmjs.org/package/superstatic) [![NPM download count](https://img.shields.io/npm/dm/superstatic.svg?style=flat-square)](https://npmjs.org/package/superstatic) [![Build Status](http://img.shields.io/travis/divshot/superstatic.svg?style=flat-square)](https://travis-ci.org/firebase/superstatic)

Superstatic is an enhanced static web server that was built to power.
It has fantastic support for HTML5 pushState applications, clean URLs,
caching, and many other goodies.

## Documentation

* [Installation](#installation)
* [Usage](#usage)
* [Configuration](#configuration)
* [API](#api)
  * [Middleware](#middleware)
  * [Server](#server)
* [Run Tests](#run-tests)
* [Changelog](https://github.com/divshot/superstatic/blob/master/CHANGELOG.md)
* [Contributing](#contributing)



## Installation

Superstatic should be installed globally using npm:

For use via CLI

```
$ npm install -g superstatic
```

For use via API

```
npm install superstatic --save
```

## Usage

By default, Superstatic will simply serve the current directory on port
`3474`. This works just like any other static server:

```
$ superstatic
```

You can optionally specify the directory, port and hostname of the server:

```
$ superstatic public --port 8080 --host 127.0.0.1
```

## Configuration

Superstatic reads special configuration from a JSON file (either `superstatic.json`
or `divshot.json` by default, configurable with `-c`). This JSON file enables
enhanced static server functionality beyond simply serving files.

**public:** by default, Superstatic will serve the current working directory (or the
ancestor of the current directory that contains the configuration json being used).
This configuration key specifies a directory *relative to the configuration file* that
should be served. For example, if serving a Jekyll app, this might be set to `"_site"`.
A directory passed as an argument into the command line app supercedes this configuration
directive.

**clean_urls:** if `true`, all `.html` files will automatically have their extensions
dropped. If `.html` is used at the end of a filename, it will perform a 301 redirect
to the same path with `.html` dropped.

All paths have clean urls

```json
{
  "clean_urls": true
}
```

Only specific paths get clean urls

```json
{
  "clean_urls": ["/app/**", "/!components/**"]
}
```

**rewrites:** you can specify custom route recognition for your application by supplying
an object to the routes key. Use a single star `*` to replace one URL segment or a
double star to replace an arbitrary piece of URLs. This works great for single page
apps. An example:

```json
{
  "rewrites": [
    {"source":"app/**","destination":"/application.html"},
    {"source":"projects/*/edit","destination":"/projects.html"}
  ]
}
```

**redirects:** you can specify certain url paths to be redirected to another url by supplying configuration to the `redirects` key. Path matching is similar to using custom routes. Redirects use the `301` HTTP status code by default, but this can be overridden by configuration.

```json
{
  "redirects": [
    {"source":"/some/old/path", "destination":"/some/new/path"},
    {"source":"/firebase/*", "destination":"https://www.firebase.com", "type": 302}
  ]
}
```

Route segments are also supported in the redirects configuration. Segmented redirects also support custom status codes (see above):

```json
{
  "redirects": [
    {"source":"/old/:segment/path", "destination":"/new/path/:segment"}
  ]
}
```

In this example, `/old/custom-segment/path` redirects to `/new/path/custom-segment`

**headers:** Superstatic allows you to set the response headers for certain paths as well:

```json
{
  "headers": [
    {
      "source" : "**/*.@(eot|otf|ttf|ttc|woff|font.css)",
      "headers" : [{
        "key" : "Access-Control-Allow-Origin",
        "value" : "*"
      }]
    }, {
      "source" : "**/*.@(jpg|jpeg|gif|png)",
      "headers" : [{
        "key" : "Cache-Control",
        "value" : "max-age=7200"
      }]
    }, {
      "source" : "404.html",
      "headers" : [{
        "key" : "Cache-Control",
        "value" : "max-age=300"
      }]
    }]
  }
}
```

**trailing_slash:** Have full control over whether or not your app has or doesn't have trailing slashes. By default, Superstatic will make assumptions for on the best times to add or remove the trailing slash. Other options include `true`, which always adds a trailing slash, and `false`, which always removes the trailing slash.

```json
{
  "trailing_slash": true
}
```

## API

Superstatic is available as a middleware and a standalone [Connect](http://www.npmjs.org/package/connect) server. This means you can plug this into your current server or run your own static server using Superstatic's server.


### Middleware

```js
var superstatic = require('superstatic')
var connect = require('connect');

var app = connect()
	.use(superstatic(/* options */));

app.listen(3000, function () {

});

```

### `superstatic([options])`

Insantiates middleware. See an [example](https://github.com/divshot/superstatic/tree/master/examples) for detail on real world use.

* `options` - Optional configuration:
  * `config` - A file path to your application's configuration file (see [Configuration](#configuration)) or an object containing your application's configuration.
  * `protect` - Adds HTTP basic auth. Example:  `username:password`
  * `env`- A file path your application's environment variables file or an object containing values that are available at the urls `/__/env.json` and `/__/env.js`. See the documentation detail on [environment variables](http://docs.divshot.com/guides/environment-variables).
  * `cwd` - The current working directory to set as the root. Your application's root configuration option will be used relative to this.
  * `services` - An object containing various Superstatic services.

### Server

```js
var superstatic = require('superstatic').server;

var app = superstatic(/* options */);

var server = app.listen(function () {

});
```

Since Superstatic's server is a barebones Connect server using the Superstatic middleware, see the [Connect documentation](https://github.com/senchalabs/connect) on how to correctly instantiate, start, and stop the server.

### `superstatic([options])`

Instantiates a Connect server, setting up Superstatic middleware, port, host, debugging, compression, etc.

* `options` - Optional configuration. Uses the same options as the middleware, plus a few more options:
  * `port` - The port of the server. Defaults to `3474`.
  * `host` or `hostname` - The hostname of the server. Defaults to `localhost`.
  * `errorPage` - A file path to a custom error page. Defaults to [Superstatic's error page](https://github.com/divshot/superstatic/blob/master/lib/assets/not_found.html).
  * `debug` - A boolean value that tells Superstatic to show or hide network logging in the console. Defaults to `false`.
  * `gzip` - A boolean value that tells Superstatic to gzip response body. Defaults to `false`.

## Run Tests

In superstatic module directory:

```
npm install
npm test
```

## Contributing

We LOVE open source and open source contributors. If you would like to contribute to Superstatic, please review our [contributing guidelines](https://github.com/divshot/superstatic/blob/master/CONTRIBUTING.md) before your jump in and get your hands dirty.
