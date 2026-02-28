/**
 * Returns true for plain objects (`{}` or `Object.create(null)`).
 * @param val value to check
 * @returns value indicating whether the value is a plain object
 */
export function isPlainObject(val: unknown): val is Record<string, unknown> {
  return (
    val !== null &&
    typeof val === "object" &&
    !Array.isArray(val) &&
    (Object.getPrototypeOf(val) === Object.prototype ||
      Object.getPrototypeOf(val) === null)
  );
}
