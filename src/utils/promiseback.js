module.exports = function promiseback(userFn, argCount) {
  // if no callback argument is provided, assume the promise form
  if (userFn.length <= argCount) {
    return userFn;
  }
  // otherwise promise-ify the callback
  return (...args) => {
    return new Promise((resolve, reject) => {
      userFn(...args, (err, res) => {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });
  };
};
