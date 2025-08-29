/**
 * Email validation utilities for determining if emails should receive communications
 */

// List of patterns that indicate test/guest accounts
const TEST_EMAIL_PATTERNS = [
  /^guest/i,           // Starts with "guest"
  /test/i,             // Contains "test"
  /demo/i,             // Contains "demo"
  /temp/i,             // Contains "temp"
  /fake/i,             // Contains "fake"
  /example/i,          // Contains "example"
  /sample/i,           // Contains "sample"
  /dummy/i,            // Contains "dummy"
  /spam/i,             // Contains "spam"
  /trash/i,            // Contains "trash"
];

// List of disposable email domains
const DISPOSABLE_DOMAINS = [
  '10minutemail.com',
  'guerrillamail.com',
  'tempmail.org',
  'mailinator.com',
  'yopmail.com',
  'sharklasers.com',
  'getairmail.com',
  'mailnesia.com',
  'maildrop.cc',
  'tempmailaddress.com',
  'throwaway.email',
  'mailmetrash.com',
  'mailnull.com',
  'spam4.me',
  'bccto.me',
  'chacuo.net',
  'dispostable.com',
  'fakeinbox.com',
  'mailcatch.com',
  'mailinator2.com',
];

/**
 * Check if an email should receive emails
 * @param email - The email address to check
 * @returns true if the email should receive emails, false otherwise
 */
export const shouldSendEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailLower = email.toLowerCase().trim();

  // Check for test/guest patterns
  for (const pattern of TEST_EMAIL_PATTERNS) {
    if (pattern.test(emailLower)) {
      return false;
    }
  }

  // Check for disposable domains
  const domain = emailLower.split('@')[1];
  if (domain && DISPOSABLE_DOMAINS.includes(domain)) {
    return false;
  }

  // Check for common test domains
  if (domain && (
    domain.includes('test') ||
    domain.includes('example') ||
    domain.includes('localhost') ||
    domain.includes('invalid')
  )) {
    return false;
  }

  return true;
};

/**
 * Get the reason why an email was rejected (for logging purposes)
 * @param email - The email address to check
 * @returns A string explaining why the email was rejected, or null if it's valid
 */
export const getEmailRejectionReason = (email: string): string | null => {
  if (!email || typeof email !== 'string') {
    return 'Invalid email format';
  }

  const emailLower = email.toLowerCase().trim();

  // Check for test/guest patterns
  for (const pattern of TEST_EMAIL_PATTERNS) {
    if (pattern.test(emailLower)) {
      return `Email matches test pattern: ${pattern.source}`;
    }
  }

  // Check for disposable domains
  const domain = emailLower.split('@')[1];
  if (domain && DISPOSABLE_DOMAINS.includes(domain)) {
    return `Disposable email domain: ${domain}`;
  }

  // Check for common test domains
  if (domain && (
    domain.includes('test') ||
    domain.includes('example') ||
    domain.includes('localhost') ||
    domain.includes('invalid')
  )) {
    return `Test domain detected: ${domain}`;
  }

  return null;
};

/**
 * Log email validation results for debugging
 * @param email - The email address that was validated
 * @param shouldSend - Whether the email should receive emails
 */
export const logEmailValidation = (email: string, shouldSend: boolean): void => {
  if (shouldSend) {
    console.log(`✅ Email validation passed: ${email}`);
  } else {
    const reason = getEmailRejectionReason(email);
    console.log(`⏭️ Email validation failed: ${email} - Reason: ${reason}`);
  }
};
