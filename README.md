# Superstatic

Superstatic is an enhanced static web server that was built to power
[Divshot.io](http://www.divshot.io). It has fantastic support for HTML5
pushState applications as well as clean URLs and other goodies.

[![Build Status](https://travis-ci.org/divshot/superstatic.png?branch=master)](https://travis-ci.org/divshot/superstatic) [![Code Climate](https://codeclimate.com/github/divshot/superstatic.png)](https://codeclimate.com/github/divshot/superstatic)

## Installation

Superstatic should be installed globally using npm:

    npm install -g superstatic
    
## Usage

By default, Superstatic will simply serve the current directory on port
3474. This works just like any other static server:

    superstatic
    
You can optionally specify the directory, port and hostname of the server:

    superstatic public --port 8080 --host 127.0.0.1
    
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

## API

### Server(options)

```js
var superstatic = require('superstatic');
var Server = superstatic.Server;

var server = superstatic.createServer(/* Server Options */);
// OR
var sever = new Server(/* Server Options */);

server.start(function () {

	// Server started

	server.stop(function () {
  	// Server started
  });
});
```

**Server Options** *(all values are optional)*

**port:** Port to run the server on. Defaults to `3474`

**host:** Host to run the server on. Defaults to `127.0.0.1` (localhost)

**config:** override defaults in the [configuration file](#configuration). This can either be a string with the name of the config file (e.g. `superstatic.json`), or it can be an object containing the values that would normally be in a config file. If an object is passed, it will override any values in the config file.
```js
var Server = require('superstatic').Server;

var server = new Server({
  config: require('config_file.json')
});

// OR

var server = new Server({
  config: 'config_file.json'
});
```

**cwd:** the current working directly that you want to serve files from. Defaults to the current directory via `process.cwd()`

**environment:** an object containing values that are available to your app with when you add the script `<script src="/__/env.js"></script>` to your app. See [Using Environment Varaiables in Your App](http://docs.divshot.com/guides/environment-variables)

**debug:** `true` or `false`. Enable or disable the output to the console for network requests. Defaults to `true` 

## Instance methods

### start(callback)

Start the server

**callback:** gets called once the server starts. Gets passed an error argument if there is an error.

### stop(callback)

Stops the server

**callback:** gets caleld once the server stops. Gets passed an error argument if there is an error.

## Run Tests

In superstatic module directory:

```
npm install
npm test
```
