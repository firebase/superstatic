/**
 * Returns true for plain objects (`{}` or `Object.create(null)`),
 * matching the behaviour of lodash's `_.isPlainObject`.
 * @param val value to check
 * @returns value indicating whether the value is a plain object
 */
function isPlainObject(val) {
  return (
    val !== null &&
    typeof val === "object" &&
    !Array.isArray(val) &&
    (Object.getPrototypeOf(val) === Object.prototype ||
      Object.getPrototypeOf(val) === null)
  );
}

module.exports = { isPlainObject };
