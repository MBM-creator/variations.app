/**
 * Generate a random 8-character shortcode (alphanumeric).
 * Used for public variation URLs: /v/[shortcode]
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0,O,1,I to avoid confusion

export function generateShortcode(length: number = 8): string {
  let result = '';
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return result;
}
