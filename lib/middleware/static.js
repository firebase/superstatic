module.exports = function (imports) {
  
  return function (req, res, next) {
    
    res.__.sendFile(req._parsedUrl.pathname)
      .on('error', function (err) {
        
        next();
      });
  };
};