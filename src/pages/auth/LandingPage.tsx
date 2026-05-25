import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  GraduationCap,
  Network,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f8f9ff] text-slate-950">
      <nav className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="text-2xl font-black text-indigo-900">
            KomunitasKampus
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            <a href="#discover">Discover</a>
            <a href="#organizations">Organizations</a>
            <a href="#events">Events</a>
          </div>

          <Button
            asChild
            className="rounded-full bg-indigo-900 px-7 hover:bg-indigo-800"
          >
            <Link to="/login">Masuk</Link>
          </Button>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-[#f8f9ff]">
        <div className="absolute left-10 top-28 hidden h-20 w-20 rotate-12 items-center justify-center rounded-3xl bg-white shadow-xl md:flex">
          <GraduationCap className="h-9 w-9 text-indigo-900" />
        </div>
        <div className="absolute bottom-28 right-20 hidden h-20 w-20 -rotate-12 items-center justify-center rounded-3xl bg-white shadow-xl md:flex">
          <UsersRound className="h-9 w-9 text-rose-700" />
        </div>

        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
          <div className="mb-8 rounded-full border border-indigo-200 bg-indigo-100 px-5 py-2 text-sm font-semibold text-indigo-900">
            Welcome to the Hub
          </div>

          <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-7xl">
            Bridging Academic Excellence and{" "}
            <span className="relative text-indigo-900">
              Social Connection
              <span className="absolute -bottom-2 left-0 h-1 w-full rounded-full bg-rose-300" />
            </span>
          </h1>

          <p className="mt-10 max-w-3xl text-lg leading-8 text-slate-600">
            Platform terstruktur untuk mahasiswa dan organisasi kampus. Temukan
            organisasi, ikuti kegiatan akademik, dan bangun koneksi dalam satu
            ekosistem kampus.
          </p>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-14 rounded-xl bg-indigo-900 px-9 text-base hover:bg-indigo-800"
            >
              <Link to="/login">
                Masuk
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 rounded-xl border-indigo-200 bg-white px-9 text-base text-indigo-900 hover:bg-indigo-50"
            >
              <Link to="/register/user">Daftar</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="discover" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">Empowering Campus Life</h2>
          <p className="mt-4 text-slate-600">
            Semua yang dibutuhkan untuk mengelola kehidupan kampus, dari
            organisasi, event, sampai percakapan komunitas.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Student Organizations",
              description: "Jelajahi organisasi aktif dan daftar langsung.",
              icon: Network,
              className: "bg-indigo-50",
            },
            {
              title: "Campus Events",
              description: "Pantau kegiatan akademik dan sosial kampus.",
              icon: GraduationCap,
              className: "bg-blue-50",
            },
            {
              title: "Peer Networking",
              description: "Terhubung dengan mahasiswa lintas fakultas.",
              icon: UsersRound,
              className: "bg-rose-50",
            },
            {
              title: "Secure Access",
              description: "Role organisasi dan mahasiswa terpisah sejak awal.",
              icon: ShieldCheck,
              className: "bg-slate-100",
            },
          ].map((item) => (
            <article
              key={item.title}
              className={`rounded-3xl border border-slate-200 p-8 ${item.className}`}
            >
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-900 text-white">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
