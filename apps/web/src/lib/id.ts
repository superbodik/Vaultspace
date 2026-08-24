// crypto.randomUUID() only exists in secure contexts (HTTPS/localhost) — this
// app is also served over plain HTTP, where that call throws "not a function".
// These ids are purely local React/Map keys, never sent to the server, so
// cryptographic randomness isn't needed — just uniqueness.
export function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
