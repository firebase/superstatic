module.exports = function(spec, condition, middleware) {
  return function(req, res, next) {
    condition(req, res, function(shouldCall) {
      shouldCall ? middleware(req, res, next) : next();
    });
  };
};
