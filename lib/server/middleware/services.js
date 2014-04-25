module.exports = function services (_services, SERVICE_PREFIX_ROUTE) {
  return function (req, res, next) {
    if (!requestIsService(req)) return next();
    
    // TODO: write those tests!!
    
    var config = serviceConfig(req);
    
    
    next();
  };
  
  function serviceConfig (req) {
    return req.config[serviceName(req.url)];
  }
  
  function requestIsService (req) {
    var url = req.url;
    var config = req.config;
    var name = serviceName(url);
    
    return requestIsServicePrefix(url)
      && serviceConfigured(name, config)
      && isService(name);
  }
  
  function isService (name) {
    return _services.hasOwnProperty(name); 
  }

  function serviceName (url) {
    var pathValues = url.split('/');
    var name = pathValues.slice(2)[0];
    return name;
  }

  function requestIsServicePrefix (url) {
    return url.indexOf('/' + SERVICE_PREFIX_ROUTE + '/') === 0;
  }

  function serviceConfigured (name, config) {
    return config.hasOwnProperty(name);
  }
};
