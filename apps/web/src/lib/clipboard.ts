// navigator.clipboard only exists in secure contexts (HTTPS/localhost) — this
// app is also served over plain HTTP, where it's undefined outright. Falls
// back to the old execCommand('copy') trick, which has no such restriction
// but is legacy and occasionally silently no-ops depending on the browser —
// so callers should still offer a real, visible input the user can
// select-and-Ctrl+C themselves as a guaranteed last resort (see ShareDialog).
export async function copyToClipboard(
  text: string,
  sourceEl?: HTMLInputElement | HTMLTextAreaElement,
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy path below
    }
  }

  // Prefer copying from a real, already-visible field over a synthetic
  // hidden one — some browsers are stricter about execCommand('copy')
  // targeting an element that was never part of a real layout/selection.
  const el = sourceEl ?? document.createElement('textarea');
  const isTemp = !sourceEl;
  if (isTemp) {
    (el as HTMLTextAreaElement).value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
  }

  try {
    el.focus();
    el.select();
    el.setSelectionRange?.(0, text.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    if (isTemp) document.body.removeChild(el);
  }
}
