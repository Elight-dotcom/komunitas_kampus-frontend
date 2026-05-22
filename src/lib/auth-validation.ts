export type PasswordStrength = {
  score: number;
  label: "Lemah" | "Cukup" | "Kuat" | "Sangat kuat";
  hints: string[];
};

export function getPasswordStrength(password: string): PasswordStrength {
  const rules = [
    {
      passed: password.length >= 8,
      hint: "Minimal 8 karakter",
    },
    {
      passed: /[A-Z]/.test(password),
      hint: "Ada huruf besar",
    },
    {
      passed: /[a-z]/.test(password),
      hint: "Ada huruf kecil",
    },
    {
      passed: /[0-9]/.test(password),
      hint: "Ada angka",
    },
    {
      passed: /[^A-Za-z0-9]/.test(password),
      hint: "Ada simbol",
    },
  ];

  const score = rules.filter((rule) => rule.passed).length;
  const hints = rules
    .filter((rule) => !rule.passed)
    .map((rule) => rule.hint);

  if (score <= 2) {
    return { score, label: "Lemah", hints };
  }

  if (score === 3) {
    return { score, label: "Cukup", hints };
  }

  if (score === 4) {
    return { score, label: "Kuat", hints };
  }

  return { score, label: "Sangat kuat", hints };
}

export function getFirstApiError(errors?: Record<string, string[]> | null) {
  if (!errors) return null;

  const firstKey = Object.keys(errors)[0];

  if (!firstKey) return null;

  return errors[firstKey]?.[0] ?? null;
}

export function validateRequired(value: string, label: string) {
  return value.trim().length === 0 ? `${label} wajib diisi.` : null;
}

export function validateEmail(value: string) {
  if (!value.trim()) return "Email wajib diisi.";

  return /^\S+@\S+\.\S+$/.test(value) ? null : "Format email tidak valid.";
}

export function validatePasswordConfirmation(password: string, confirmPassword: string) {
  if (!confirmPassword) return "Confirm password wajib diisi.";

  return password === confirmPassword
    ? null
    : "Confirm password tidak sama dengan password.";
}
