import type { ReactNode } from "react";
import { AuthIllustration } from "@/components/auth/auth-illustration";

type AuthShellProps = {
  children: ReactNode;
  illustration?: "login" | "student" | "organization";
};

export function AuthShell({ children, illustration = "login" }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        <AuthIllustration variant={illustration} />
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-xl">{children}</div>
        </section>
      </div>
    </main>
  );
}
