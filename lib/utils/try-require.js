module.exports = function (moduleName) {
  var serviceModule;
  
  try {serviceModule = require(moduleName);}
  catch (e) {}
  
  return serviceModule;
};