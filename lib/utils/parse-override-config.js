module.exports = function (argv) {
  var overrideConfig = argv.config || argv.c || undefined;
  
  try { overrideConfig = JSON.parse(overrideConfig); }
  catch (e) {}
  
  return overrideConfig;
};