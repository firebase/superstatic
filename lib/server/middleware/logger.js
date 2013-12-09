module.exports = function logger (enableLogging, print) {
  return function (req, res, next) {
    if (enableLogging) {
      print('HOST:', req.headers.host, '- PATH:', req.url);
    }

    next();
  };
};