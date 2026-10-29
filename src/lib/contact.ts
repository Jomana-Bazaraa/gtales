/** Free-story contact (SPEC §7.2): an email, or an Egyptian mobile number when the parent has no email. Client-safe. */
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** "010 1234 5678", "+20 101 234 5678", "00201012345678" → "01012345678"; null if it isn't an Egyptian mobile (010/011/012/015). */
export function egyptMobile(s: string): string | null {
  let d = s.replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(d)) return null;
  d = d.replace(/^\+/, "").replace(/^0020/, "").replace(/^20(?=1)/, "");
  if (/^1[0125]\d{8}$/.test(d)) d = "0" + d;
  return /^01[0125]\d{8}$/.test(d) ? d : null;
}
