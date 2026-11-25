import crypto from "crypto";

/**
 * Generate a 12-character temp password with mixed case, digits and one symbol.
 * Always satisfies the strength rules: 8+ chars, 1+ uppercase, 1+ digit.
 * Avoids ambiguous characters (0/O/1/l/I).
 */
export const generateTempPassword = (): string => {
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*";
  const pick = (set: string) =>
    set[crypto.randomInt(0, set.length)];

  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const remaining = Array.from({ length: 8 }, () =>
    pick(upper + lower + digits)
  );
  // shuffle
  const all = [...required, ...remaining];
  for (let i = all.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.join("");
};

/** Returns null if valid, otherwise a French error message. */
export const validatePasswordStrength = (password: string): string | null => {
  if (typeof password !== "string" || password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caractères.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Le mot de passe doit contenir au moins une lettre majuscule.";
  }
  if (!/[0-9]/.test(password)) {
    return "Le mot de passe doit contenir au moins un chiffre.";
  }
  return null;
};

/** Single-use reset token: returns the raw token (sent in URL) and its sha256 hash (stored in DB). */
export const generateResetToken = (): { raw: string; hash: string } => {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
};

export const hashResetToken = (raw: string): string =>
  crypto.createHash("sha256").update(raw).digest("hex");

export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
