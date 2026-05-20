const configuredPremiumEmails = String(import.meta.env.VITE_PREMIUM_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const premiumEmails = new Set(["sanehaldarji1@gmail.com", ...configuredPremiumEmails]);

export function hasPremiumAccess(email?: string | null) {
  return Boolean(email && premiumEmails.has(email.trim().toLowerCase()));
}

export function premiumAccessWindow() {
  const startedAt = Date.now();
  return {
    startedAt,
    expiresAt: startedAt + 1000 * 60 * 60 * 24 * 365
  };
}
