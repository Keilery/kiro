import argon2 from "argon2";

/**
 * Argon2id parameters.
 *
 * Tuned to ~150-250ms on a modern server. Argon2 is the OWASP-recommended
 * default for new applications (2024+).
 *
 * If you need to migrate existing bcrypt hashes, detect the prefix
 * (`$2a$` / `$2b$`) at verify-time and rehash on successful login.
 */
const OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456, // ~19 MiB
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, OPTIONS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    // Malformed hash, etc. Treat as a verification failure rather than throw.
    return false;
  }
}

/**
 * Heuristic strength meter used as soft feedback in the UI.
 * The hard rule (≥10 chars + at least one letter and digit) is enforced
 * by the zod password schema.
 */
export function passwordStrength(plain: string): "weak" | "ok" | "strong" {
  if (plain.length < 8) return "weak";
  const classes = [
    /[a-z]/.test(plain),
    /[A-Z]/.test(plain),
    /\d/.test(plain),
    /[^a-zA-Z0-9]/.test(plain),
  ].filter(Boolean).length;
  if (plain.length >= 14 && classes >= 3) return "strong";
  if (plain.length >= 10 && classes >= 2) return "ok";
  return "weak";
}
