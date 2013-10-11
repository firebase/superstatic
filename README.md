# Superstatic

Superstatic is an enhanced static web server that was built to power
[Divshot.io](http://www.divshot.io). It has fantastic support for HTML5
pushState applications as well as clean URLs and other goodies.

## Installation

Superstatic should be installed globally using npm:

    npm install -g superstatic
    
## Usage

By default, Superstatic will simply serve the current directory on port
3474. This works just like any other static server:

    superstatic
    
You can specify the port and hostname of the server:

    superstatic --port 8080 --host 127.0.0.1
    
Where it gets interesting is with the JSON configuration file.

## Configuration

Superstatic reads special configuration from a JSON file (either `superstatic.json`
or `divshot.json` by default, configurable with `-c`). This JSON file enables
enhanced static server functionality beyond simply serving files.

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

**max_age:** by default, all pages served by superstatic have cache control headers set at
24 hours. To change them, you can supply an object containing file globs and ages (in seconds).
An example:

```json
{
  "max_age": {
    "**/*.html": 600
  }
}
```
