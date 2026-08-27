/**
 * Security utilities for input sanitization and anti-spam protection.
 */

/**
 * Strips HTML tags and suspicious scripts from input text.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Honeypot validation check.
 * If honeypot field is filled by a bot, returns false (invalid submission).
 */
export function isHoneypotValid(honeypotValue?: string): boolean {
  return !honeypotValue || honeypotValue.trim() === '';
}
