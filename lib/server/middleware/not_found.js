var path = require('path');

var notFound = function (req, res, next) {
  if (!req.superstatic || !req.superstatic.path) {
    // req.superstatic = req.superstatic || {}:
    // req.superstatic.path = 'jobs.html';
    
    // console.log('Not Found:', req.url);
    
    res.writeHead(404);
    return res.end();
  }
  
  next();
};

module.exports = notFound;