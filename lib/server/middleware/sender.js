var send = require('send');

module.exports = function () {
  return function (req, res, next) {
    res.send = function (pathname) {
      send(req, pathname)
        .root(req.ss.config.cwd)
        .on('error', function () {
          next();
        })
        .pipe(res);
    }
    
    next();
  };
};