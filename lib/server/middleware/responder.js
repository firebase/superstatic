var fs = require('fs');
var mime = require('mime');

var responder = function (req, res) {
  res.setHeader('Content-Type', mime.lookup(req.superstatic.path));
  fs.createReadStream(req.superstatic.path).pipe(res);
};

module.exports = responder;