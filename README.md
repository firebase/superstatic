# Superstatic   [![NPM Module](http://img.shields.io/npm/v/superstatic.svg?style=flat-square)](https://npmjs.org/package/superstatic) [![Build Status](http://img.shields.io/travis/divshot/superstatic.svg?style=flat-square)](https://travis-ci.org/divshot/superstatic) [![Code Climate](http://img.shields.io/codeclimate/github/divshot/superstatic.svg?style=flat-square)](https://codeclimate.com/github/divshot/superstatic)

Superstatic is an enhanced static web server that was built to power
[Divshot](http://www.divshot.io). It has fantastic support for HTML5
pushState applications, clean URLs, caching, and MANY other goodies.

## Documentation

* [Installation](#installation)
* [Usage](#usage)
* [Configuration](#configuration)
* [Services](#services)
* [API](#api)
* [Run Tests](#run-tests)
* [Changelog](https://github.com/divshot/superstatic/releases)
* [Contributing](#contributing)

## Installation

Superstatic should be installed globally using npm:

```
$ npm install -g superstatic
```
    
## Usage

By default, Superstatic will simply serve the current directory on port
3474. This works just like any other static server:

```
$ superstatic
```

or aliased as

```
$ ss
```
    
You can optionally specify the directory, port and hostname of the server:

```
$ superstatic public --port 8080 --host 127.0.0.1
```
    
Where it gets interesting is with Superstatic's JSON configuration file.

## Configuration

Superstatic reads special configuration from a JSON file (either `superstatic.json`
or `divshot.json` by default, configurable with `-c`). This JSON file enables
enhanced static server functionality beyond simply serving files.

**root:** by default, Superstatic will serve the current working directory (or the
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
  "clean_urls": ["/app**", "!/components**"]
}
```

**routes:** you can specify custom route recognition for your application by supplying
an object to the routes key. Use a single star `*` to replace one URL segment or a
double star to replace an arbitrary piece of URLs. This works great for single page
apps. An example:

```json
{
  "routes": {
    "app/**":"application.html",
    "projects/*/edit":"projects.html"
  }
}
```

**redirects:** you can specify to have certain url paths be redirected (specifying a custom http status code, or which defaults to 301) to other url paths by supplying an object to the `redirects` key. Route path matching is similar to using custom routes. For example:

Default 301 redirect

```json
{
  "redirects": {
    "/some/old/path": "/some/new/path"
  }
}
```

Custom http status code

```json
{
  "redirects": {
    "/some/old/path": {
      "status": 302,
      "url": "/some/new/path"
    }
  }
}
```

Route segments are also supported in the redirects configuration. Segmented redirects also support custom status codes (see above):

```json
{
  "redirects": {
    "/old/:segment/path": "/new/path/:segment"
  }
}
```

In this example, `/old/custom-segment/path` redirect to `/new/path/custom-segment`

**error_page:** the path to the page that you want to render 404 errors if an unrecognized
URL is supplied. For example, `error.html`.

**cache_control:** by default, all pages served by superstatic have cache control headers set at
1 hour. To change them, you can supply an object containing file globs and ages (in seconds).
You can also specify `false` to indicate that no caching should be performed, and a string to
manually set the cache control header. An example:

```json
{
  "cache_control": {
    "nocache/**": false,
    "**/*.html": 600,
    "private/**": "private, max-age=1200"
  }
}
```

Note that you can pass the `--no-cache` option when you run the server to serve all content
without caching. This is good to use during development when you want fresh content served
on each request.

**Headers:** Superstatic allows you to set the response headers for the given routing configuration.

```json
{
  "headers": {
    "/cors-stuff/**": {
      "Access-Control-Allow-Origin": "*"
    },
    "/scripts/**": {
      "content-type": "text/javascript"
    }
  }
}
```

## Services

**Services** are extensions that provide additional functionality. More TBD.

## API

The Superstatic server is just an extended version of the [Connect](http://www.npmjs.org/package/connect) server. This means you can use any custom middlewares you like that work with Connect.

### superstatic([options])

```js
var superstatic = require('superstatic');

var app = superstatic(/* server options */);

app.listen(function (err) {
  // Server started
});
```

#### Server Options *(all values are optional)*

* **port:** Port to run the server on. Defaults to `3474`
* **host:** Host to run the server on. Defaults to `127.0.0.1` (localhost)
* **logger:** Provide custom logging functions. The three logging functions used are `info`, `warn`, and `error`. By default, these are printed to *stdout*. You can provide custom functions to log to 3rd party log services such as [Papertrail](https://papertrailapp.com/) use the NPM module [Winston](https://github.com/kenperkins/winston-papertrail). For example:

```js
var superstatic = require('superstatic');
var app = superstatic({
  logger: {
    info: function (msg) {
      console.log('Info:', msg);
    },
    error: function (msg) {
      console.error('Error:', msg);
    }
  }
});
```

* **config:** override defaults in the [configuration file](#configuration). This can either be a string with the name of the config file (e.g. `superstatic.json`), or it can be an object containing the values that would normally be in a config file. If an object is passed, it will override any values in the config file. For example:

```js
var Server = require('superstatic');

var server = superstatic({
  config: require('config_file.json')
});

// OR

var server = superstatic({
  config: 'config_file.json'
});
```

* **cwd:** the current working directly that you want to serve files from. Defaults to the current directory via `process.cwd()`
* **localEnv:** an object containing values that are available to your app with when you add the script `<script src="/__/env.js"></script>` to your app. See [Using Environment Varaiables in Your App](http://docs.divshot.com/guides/environment-variables)
* **debug:** `true` or `false`. Enable or disable the output to the console for network requests. Defaults to `true` 

## Server Instance methods

### listen([port, host, callback])

Start the server. Returns and instance of [`http.createServer`](http://nodejs.org/api/http.html#http_http_createserver_requestlistener). All arguments are optional

* **port:** port for server to listen on. Defaults to `3474` and is overridden by the port in server options
* **host:** server host Defaults to `127.0.0.1` and is overridden by the host in server options
* **callback:** gets called once the server starts. Gets passed an error argument if there is an error.

### close(callback)

Stops the server and close all connections

* **callback:** gets called once the server stops. Gets passed an error argument if there is an error.

**Note:** Since Superstatic uses Connect, any instance methods availble on a Connect instance are available on the Superstatic instance.

## Run Tests

In superstatic module directory:

```
npm install
npm test
```

## Contributing

We LOVE open source and open source contributors. If you would like to contribute to Superstatic, please review our [contributing guidelines](https://github.com/divshot/superstatic/blob/master/CONTRIBUTING.md) before your jump in and get your hands dirty.
