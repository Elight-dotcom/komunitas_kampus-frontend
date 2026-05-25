import { authApi } from "@/api/auth";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrengthIndicator } from "@/components/auth/password-strength-indicator";
import { RegisterTypeToggle } from "@/components/auth/register-type-toggle";
import { UsernameAvailabilityHint } from "@/components/auth/username-availability-hint";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getFirstApiError,
  validateEmail,
  validatePasswordConfirmation,
  validateRequired,
} from "@/lib/auth-validation";
import { AxiosError } from "axios";
import { AtSign, Building2, Mail, UserRound } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type RegisterUserForm = {
  fullName: string;
  university: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialForm: RegisterUserForm = {
  fullName: "",
  university: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function RegisterUserPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      form.fullName.trim() &&
      form.university.trim() &&
      form.username.trim() &&
      form.email.trim() &&
      form.password &&
      form.confirmPassword &&
      acceptedTerms
    );
  }, [form, acceptedTerms]);

  function updateField(field: keyof RegisterUserForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: null }));
  }

  function validateForm() {
    const errors: Record<string, string | null> = {
      fullName: validateRequired(form.fullName, "Nama lengkap"),
      university: validateRequired(form.university, "Universitas"),
      username: validateRequired(form.username, "Username"),
      email: validateEmail(form.email),
      password: validateRequired(form.password, "Password"),
      confirmPassword: validatePasswordConfirmation(
        form.password,
        form.confirmPassword,
      ),
    };

    setFieldErrors(errors);

    return Object.values(errors).every((error) => !error);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!acceptedTerms) {
      setFormError(
        "Kamu harus menyetujui Terms of Service dan Privacy Policy.",
      );
      return;
    }

    if (!validateForm()) {
      setFormError("Periksa kembali form registrasi.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await authApi.registerUser(form);

      if (!response.success) {
        setFormError(response.message);
        return;
      }

      navigate("/login", { replace: true });
    } catch (error) {
      if (error instanceof AxiosError) {
        setFormError(
          getFirstApiError(error.response?.data.errors) ??
            error.response?.data.message ??
            "Registrasi mahasiswa gagal.",
        );
        return;
      }

      setFormError("Terjadi kesalahan saat registrasi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell illustration="student">
      <div className="mb-10">
        <RegisterTypeToggle active="user" />
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Create Student Account
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Join KomunitasKampus using your academic details.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthFormError message={formError} />

        <FieldWithIcon
          id="fullName"
          label="Nama Lengkap"
          icon={UserRound}
          value={form.fullName}
          placeholder="John Doe"
          error={fieldErrors.fullName}
          onChange={(value) => updateField("fullName", value)}
        />

        <FieldWithIcon
          id="university"
          label="Universitas"
          icon={Building2}
          value={form.university}
          placeholder="e.g. Universitas Indonesia"
          error={fieldErrors.university}
          onChange={(value) => updateField("university", value)}
        />

        <div>
          <FieldWithIcon
            id="username"
            label="Username"
            icon={AtSign}
            value={form.username}
            placeholder="johndoe_ui"
            error={fieldErrors.username}
            onChange={(value) => updateField("username", value)}
          />
          <UsernameAvailabilityHint username={form.username} />
        </div>

        <FieldWithIcon
          id="email"
          label="Email"
          icon={Mail}
          value={form.email}
          placeholder="john.doe@university.ac.id"
          error={fieldErrors.email}
          onChange={(value) => updateField("email", value)}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password" className="font-bold tracking-wide">
              Password
            </Label>
            <PasswordInput
              id="password"
              value={form.password}
              onChange={(value) => updateField("password", value)}
            />
            <PasswordStrengthIndicator password={form.password} />
            {fieldErrors.password && (
              <p className="text-xs text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="font-bold tracking-wide"
            >
              Confirm Password
            </Label>
            <PasswordInput
              id="confirmPassword"
              value={form.confirmPassword}
              onChange={(value) => updateField("confirmPassword", value)}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-red-600">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 pt-2">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(Boolean(checked))}
          />
          <Label htmlFor="terms" className="leading-6 text-slate-600">
            I agree to the{" "}
            <span className="font-bold text-indigo-900">Terms of Service</span>{" "}
            and{" "}
            <span className="font-bold text-indigo-900">Privacy Policy</span>.
          </Label>
        </div>

        <div className="border-t border-slate-200 pt-7">
          <Button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="h-14 w-full rounded-xl bg-indigo-900 text-base font-bold hover:bg-indigo-800"
          >
            {isSubmitting ? "Registering..." : "Register Account"}
          </Button>
        </div>

        <p className="text-center text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-indigo-900">
            Sign in here
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

type FieldWithIconProps = {
  id: string;
  label: string;
  icon: typeof UserRound;
  value: string;
  placeholder: string;
  error?: string | null;
  onChange: (value: string) => void;
};

function FieldWithIcon({
  id,
  label,
  icon: Icon,
  value,
  placeholder,
  error,
  onChange,
}: FieldWithIconProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="font-bold tracking-wide">
        {label}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-14 rounded-xl border-slate-300 bg-white pl-12 text-base focus-visible:ring-indigo-200"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
