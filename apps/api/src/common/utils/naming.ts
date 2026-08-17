function splitExt(name: string): { base: string; ext: string } {
  const idx = name.lastIndexOf('.');
  if (idx <= 0 || idx === name.length - 1) return { base: name, ext: '' };
  return { base: name.slice(0, idx), ext: name.slice(idx) };
}

function withSuffix(name: string, n: number): string {
  const { base, ext } = splitExt(name);
  return `${base} (${n})${ext}`;
}

/** True if `name` is already taken, case-insensitively, in `existingNames`. */
export function isNameTaken(name: string, existingNames: string[]): boolean {
  const lower = name.trim().toLowerCase();
  return existingNames.some((n) => n.toLowerCase() === lower);
}

/**
 * Finds the next free "name (n)" variant not present in existingNames.
 * Used to silently resolve conflicts on upload, the way Drive/Dropbox do.
 */
export function dedupeName(desiredName: string, existingNames: string[]): string {
  if (!isNameTaken(desiredName, existingNames)) return desiredName;
  let n = 1;
  let candidate = withSuffix(desiredName, n);
  while (isNameTaken(candidate, existingNames)) {
    n += 1;
    candidate = withSuffix(desiredName, n);
  }
  return candidate;
}
