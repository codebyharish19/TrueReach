import { z } from 'zod';

// Comprehensive email validation schema using Zod
export const emailSchema = z.string().email({
  message: "Please enter a valid email address"
});

// Enhanced email validation function
export function validateEmailSyntax(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

// More comprehensive RFC 5322 compliant email regex
export const RFC5322_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Domain validation function
export function validateDomain(email: string): boolean {
  if (!email.includes('@')) return false;
  
  const domain = email.split('@')[1];
  if (!domain) return false;
  
  // Check domain format
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!domainRegex.test(domain)) return false;
  
  // Check for valid TLD
  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  return tld.length >= 2 && /^[a-zA-Z]+$/.test(tld);
}

// Check if email is from a disposable email provider
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  const disposableDomains = [
    '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'tempmail.org',
    'throwaway.email', 'temp-mail.org', 'yopmail.com', 'maildrop.cc',
    'sharklasers.com', 'guerrillamailblock.com', 'pokemail.net', 'spam4.me',
    'tempail.com', 'tempmailaddress.com', 'emailondeck.com', 'mohmal.com',
    'mytrashmail.com', 'mailnesia.com', 'trashmail.com', 'dispostable.com'
  ];
  
  return disposableDomains.includes(domain);
}

// Check if email is role-based
export function isRoleBasedEmail(email: string): boolean {
  const localPart = email.split('@')[0]?.toLowerCase();
  if (!localPart) return false;
  
  const roleBasedPrefixes = [
    'admin', 'administrator', 'info', 'support', 'sales', 'contact', 'help',
    'noreply', 'no-reply', 'webmaster', 'postmaster', 'hostmaster', 'abuse',
    'security', 'privacy', 'legal', 'billing', 'accounts', 'marketing',
    'hr', 'careers', 'jobs', 'recruitment', 'press', 'media', 'news'
  ];
  
  return roleBasedPrefixes.some(prefix => 
    localPart === prefix || localPart.startsWith(prefix + '.') || localPart.startsWith(prefix + '-')
  );
}

// Simulate MX record check
export function simulateMXCheck(domain: string): boolean {
  // In a real implementation, this would do actual DNS lookup
  // For simulation, we'll assume most common domains have MX records
  const commonDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'protonmail.com', 'zoho.com', 'mail.com', 'gmx.com'
  ];
  
  // Return true for common domains, random for others
  if (commonDomains.includes(domain.toLowerCase())) {
    return true;
  }
  
  // For other domains, simulate 85% success rate
  return Math.random() > 0.15;
}

// Simulate catch-all detection
export function simulateCatchAllDetection(domain: string): boolean {
  // Simulate catch-all detection - some domains are known to have catch-all
  const catchAllDomains = ['example.com', 'test.com', 'demo.com'];
  
  if (catchAllDomains.includes(domain.toLowerCase())) {
    return true;
  }
  
  // Random simulation for other domains (20% chance)
  return Math.random() < 0.2;
}

// Simulate SMTP mailbox check
export function simulateSMTPCheck(email: string): boolean {
  // In a real implementation, this would attempt SMTP connection
  // For simulation, we'll base it on other factors
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  // Higher success rate for common email providers
  const reliableProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'protonmail.com', 'zoho.com'
  ];
  
  if (reliableProviders.includes(domain)) {
    return Math.random() > 0.05; // 95% success rate for reliable providers
  }
  
  // Lower success rate for other domains
  return Math.random() > 0.3; // 70% success rate for other domains
}

// Calculate overall email score
export function calculateEmailScore(validationResults: {
  syntax: boolean;
  domain: boolean;
  mx: boolean;
  disposable: boolean;
  roleBased: boolean;
  catchAll: boolean;
  smtp: boolean;
}): number {
  const weights = {
    syntax: 20,      // Critical - must have valid syntax
    domain: 15,      // Important - domain must exist
    mx: 15,          // Important - must have mail servers
    disposable: -10, // Negative - disposable emails are bad
    roleBased: -5,   // Slightly negative - role-based emails are less personal
    catchAll: -5,    // Slightly negative - catch-all domains are less reliable
    smtp: 25         // Very important - mailbox must exist
  };
  
  let score = 0;
  
  if (validationResults.syntax) score += weights.syntax;
  if (validationResults.domain) score += weights.domain;
  if (validationResults.mx) score += weights.mx;
  if (validationResults.disposable) score += weights.disposable;
  if (validationResults.roleBased) score += weights.roleBased;
  if (validationResults.catchAll) score += weights.catchAll;
  if (validationResults.smtp) score += weights.smtp;
  
  // Normalize to 0-100 scale
  const maxPossibleScore = weights.syntax + weights.domain + weights.mx + weights.smtp;
  const normalizedScore = Math.max(0, Math.min(100, (score / maxPossibleScore) * 100));
  
  return Math.round(normalizedScore);
}

// Determine email status based on score
export function getEmailStatus(score: number): 'valid' | 'risky' | 'invalid' {
  if (score >= 75) return 'valid';
  if (score >= 40) return 'risky';
  return 'invalid';
}

// Complete email validation function
export async function validateEmail(email: string) {
  const syntax = validateEmailSyntax(email);
  
  if (!syntax) {
    return {
      email,
      syntax: false,
      domain: false,
      mx: false,
      disposable: false,
      roleBased: false,
      catchAll: false,
      smtp: false,
      score: 0,
      status: 'invalid' as const
    };
  }
  
  const domain = email.split('@')[1];
  const domainValid = validateDomain(email);
  const mx = domainValid ? simulateMXCheck(domain) : false;
  const disposable = isDisposableEmail(email);
  const roleBased = isRoleBasedEmail(email);
  const catchAll = domainValid ? simulateCatchAllDetection(domain) : false;
  const smtp = mx && !disposable ? simulateSMTPCheck(email) : false;
  
  const validationResults = {
    syntax,
    domain: domainValid,
    mx,
    disposable,
    roleBased,
    catchAll,
    smtp
  };
  
  const score = calculateEmailScore(validationResults);
  const status = getEmailStatus(score);
  
  return {
    email,
    ...validationResults,
    score,
    status
  };
}