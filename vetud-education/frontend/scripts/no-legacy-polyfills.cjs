// Turbopack loader (see next.config.ts): empties Next's built-in polyfill module.
// It patches Array.prototype.at/flat/flatMap, Object.fromEntries/hasOwn, String trimStart/trimEnd and
// a few more, all of which every browser Next 16 supports (Chrome 111, Safari 16.4, Firefox 111) has
// built in. Lighthouse flags it as "Legacy JavaScript" on every page.
module.exports = function noLegacyPolyfills() {
  return "export {}\n"
}
