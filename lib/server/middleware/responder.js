var fs = require('fs');
var mime = require('mime');

var responder = function (req, res) {
  var fileStream = req.ssRouter.store.get(req.superstatic.path);
  
  res.setHeader('Content-Type', fileStream.type);
  fileStream.pipe(res);
};

module.exports = responder;