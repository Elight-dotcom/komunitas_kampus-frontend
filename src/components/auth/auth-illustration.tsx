import { ArrowLeft, GraduationCap, Network, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type AuthIllustrationProps = {
  variant?: "login" | "student" | "organization";
};

export function AuthIllustration({ variant = "login" }: AuthIllustrationProps) {
  const isStudent = variant === "student";
  const isOrganization = variant === "organization";

  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-slate-900 lg:block">
      <div
        className={[
          "absolute inset-0 bg-cover bg-center opacity-70",
          isStudent
            ? "bg-[url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1600&auto=format&fit=crop')]"
            : isOrganization
              ? "bg-[url('https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1600&auto=format&fit=crop')]"
              : "bg-[url('https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1600&auto=format&fit=crop')]",
        ].join(" ")}
      />
      <div className="absolute inset-0 bg-indigo-950/55 backdrop-blur-[1px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-indigo-950/80" />

      <div className="relative z-10 flex min-h-screen flex-col justify-between p-10">
        <Button
          asChild
          variant="secondary"
          className="w-fit rounded-full bg-white/20 px-6 text-white backdrop-blur-md hover:bg-white/30"
        >
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        <div className="max-w-xl text-white">
          {isStudent && (
            <>
              <div className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-bold uppercase tracking-wide backdrop-blur-md">
                Join the Network
              </div>
              <h1 className="text-5xl font-black leading-tight">
                Innovate.
                <br />
                Collaborate.
                <br />
                Discover.
              </h1>
              <p className="mt-7 text-xl text-white/85">
                Connect with peers, organize events, and build your academic portfolio in one unified campus hub.
              </p>
            </>
          )}

          {isOrganization && (
            <div className="rounded-3xl border border-white/20 bg-white/85 p-8 text-slate-900 shadow-2xl backdrop-blur-xl">
              <div className="mb-5 inline-flex items-center gap-3 text-lg font-bold text-indigo-900">
                <UsersRound className="h-5 w-5" />
                KomunitasKampus
              </div>
              <h1 className="text-2xl font-semibold">Empower Your Campus Community</h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">
                Register your organization to streamline communication, manage events, and connect with students in a structured academic environment.
              </p>
            </div>
          )}

          {variant === "login" && (
            <>
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-md">
                <GraduationCap className="h-9 w-9" />
              </div>
              <h1 className="text-5xl font-black leading-tight">
                Welcome back to your campus network.
              </h1>
              <p className="mt-6 text-xl text-white/80">
                Continue managing communities, events, posts, and conversations in one trusted academic platform.
              </p>
            </>
          )}
        </div>

        <div className="flex gap-4">
          {[GraduationCap, Network, UsersRound].map((Icon, index) => (
            <div
              key={index}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md"
            >
              <Icon className="h-6 w-6" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
