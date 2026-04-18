// Runs before the rest of the app (import first from index.js).
// Some system browsers still miss the HTML `var global` binding for deps that read `global`.
if (typeof globalThis !== 'undefined' && globalThis.global === undefined) {
  globalThis.global = globalThis;
}
