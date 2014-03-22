var env = function (settings) {
  return function (req, res, next) {
    
    next();
    
  };
};

module.exports = env;