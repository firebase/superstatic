module.exports = function (imports) {
  
  return function (req, res, next) {
    
    res.__.sendFile(req.url)
      .on('error', function (err) {
        
        next();
      });
  };
};