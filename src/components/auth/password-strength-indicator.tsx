import { getPasswordStrength } from "@/lib/auth-validation";

type PasswordStrengthIndicatorProps = {
  password: string;
};

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const filledBars = Math.min(strength.score, 5);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={[
              "h-1.5 flex-1 rounded-full transition",
              index < filledBars
                ? strength.score <= 2
                  ? "bg-red-500"
                  : strength.score === 3
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                : "bg-slate-200",
            ].join(" ")}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Kekuatan password:{" "}
        <span className="font-semibold text-slate-700">{strength.label}</span>
        {strength.hints.length > 0 ? ` — ${strength.hints.join(", ")}` : ""}
      </p>
    </div>
  );
}
