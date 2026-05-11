/**
 * Normalize any user-entered Instagram identifier into the canonical handle.
 *
 *   "niyaradiaries"                          → "niyaradiaries"
 *   "@niyaradiaries"                         → "niyaradiaries"
 *   "https://www.instagram.com/niyaradiaries/"        → "niyaradiaries"
 *   "https://instagram.com/niyaradiaries/?hl=en"      → "niyaradiaries"
 *   "instagram.com/niyaradiaries"            → "niyaradiaries"
 */
export function normalizeIgHandle(input: string | null | undefined): string {
  if (!input) return "";
  let s = String(input).trim();
  if (!s) return "";
  s = s.replace(/^@/, "");
  s = s.replace(/^https?:\/\//i, "");
  s = s.replace(/^www\./i, "");
  s = s.replace(/^instagram\.com\//i, "");
  s = s.replace(/^m\.instagram\.com\//i, "");
  // Drop anything from the first slash or query separator onward.
  s = s.split(/[/?#]/)[0];
  return s.toLowerCase();
}

export function igUrl(handle: string | null | undefined): string {
  const h = normalizeIgHandle(handle);
  return h ? `https://instagram.com/${h}` : "";
}
