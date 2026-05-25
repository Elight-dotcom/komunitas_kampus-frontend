import { Lock, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { AuthBrand } from "@/components/auth/auth-brand";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth";
import type { ApiResponse } from "@/types/auth";
import { getFirstApiError } from "@/lib/auth-validation";

export function LoginPage() {
  const navigate = useNavigate();
  const setAuthFromLoginResponse = useAuthStore((state) => state.setAuthFromLoginResponse);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!identifier.trim() || !password.trim()) {
      setFormError("Email/username dan password wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await authApi.login({
        identifier,
        password,
      });

      if (!response.success || !response.data) {
        setFormError(response.message);
        return;
      }

      setAuthFromLoginResponse(response.data);
      navigate(response.data.role === "Organisasi" ? "/organization" : "/home", {
        replace: true,
      });
    } catch (error) {
      if (error instanceof AxiosError<ApiResponse<unknown>>) {
        setFormError(
          getFirstApiError(error.response?.data.errors) ??
            error.response?.data.message ??
            "Login gagal. Cek email/username dan password."
        );
        return;
      }

      setFormError("Terjadi kesalahan saat login.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell illustration="login">
      <div className="mb-12">
        <AuthBrand />
        <h1 className="mt-10 text-4xl font-black tracking-tight text-slate-950">
          Welcome Back
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Sign in to your student or organization account.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <AuthFormError message={formError} />

        <div className="space-y-2">
          <Label htmlFor="identifier" className="font-bold tracking-wide">
            Email or Username
          </Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Enter your email or username"
              className="h-14 rounded-xl border-slate-300 bg-white pl-12 text-base focus-visible:ring-indigo-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="font-bold tracking-wide">
              Password
            </Label>
            <button type="button" className="text-sm font-bold text-indigo-900">
              Forgot password?
            </button>
          </div>
          <PasswordInput id="password" value={password} onChange={setPassword} />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-14 w-full rounded-xl bg-indigo-900 text-base font-bold hover:bg-indigo-800"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Button>

        <p className="pt-8 text-center text-slate-600">
          Don't have an account?{" "}
          <Link to="/register/user" className="font-bold text-indigo-900">
            Create one now
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
