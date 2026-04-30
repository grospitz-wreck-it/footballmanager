export function debugLog(...args) {
  if (window.DEBUG) console.log(...args);
}

export function debugWarn(...args) {
  if (window.DEBUG) console.warn(...args);
}
