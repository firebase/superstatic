// TODO: test all this

var etag = require('etag');

exports.fresh = function (reqEtag, resEtag) {
  
  // If etags disabled, don't want to assume
  // that undefined etags are equal
  if (reqEtag === undefined || resEtag === undefined) {
    return false;
  }
  
  return reqEtag === resEtag;
};

exports.generateEtag = function (body, encoding) {
  
  var buf = !Buffer.isBuffer(body)
    ? new Buffer(body, encoding)
    : body;

  return etag(buf, {weak: false});
};