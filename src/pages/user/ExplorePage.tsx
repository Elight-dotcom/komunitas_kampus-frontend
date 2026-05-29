import { useQuery } from "@tanstack/react-query";
import { Building2, Search, Users, FileText, Loader2, Compass } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  organizationsApi,
  type OrganizationCard,
} from "@/api/organizations/organizations.api";
import { UserSidebar } from "@/components/layouts/UserSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth/auth.store";

// ─── Skeleton card ────────────────────────────────────────────────────────────
function OrgCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

// ─── Organization Card ────────────────────────────────────────────────────────
function OrgCard({ org }: { org: OrganizationCard }) {
  const navigate = useNavigate();

  const initials = org.organizationName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={() => navigate(`/organizations/${org.id}/profile`)}
      className="group flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md text-left w-full cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 shrink-0 ring-2 ring-indigo-50">
          {org.avatarUrl ? (
            <img src={org.avatarUrl} alt={org.organizationName} className="h-full w-full object-cover" />
          ) : (
            <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-base">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-neutral-900 group-hover:text-indigo-700 transition">
            {org.organizationName}
          </h3>
          <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
            <Building2 className="h-3 w-3" />
            {org.university}
          </p>

          {org.description && (
            <p className="mt-2 text-sm text-neutral-600 line-clamp-2 leading-relaxed">
              {org.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        <Badge variant="secondary" className="flex items-center gap-1 text-xs font-medium">
          <Users className="h-3 w-3" />
          {org.memberCount} anggota
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1 text-xs font-medium">
          <FileText className="h-3 w-3" />
          {org.postCount} postingan
        </Badge>
        <span className="ml-auto text-xs text-neutral-400">@{org.slug}</span>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [inputValue, setInputValue] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // debounce input 400ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(inputValue);
      if (inputValue.trim()) {
        setSearchParams({ q: inputValue.trim() }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, setSearchParams]);

  const isSearching = debouncedQuery.trim().length > 0;

  // Query: search (saat ada input)
  const searchQuery = useQuery({
    queryKey: ["organizations", "search", debouncedQuery],
    queryFn: () => organizationsApi.search(debouncedQuery),
    enabled: isSearching,
    staleTime: 30_000,
  });

  // Query: rekomendasi (saat input kosong)
  const recommendedQuery = useQuery({
    queryKey: ["organizations", "recommended"],
    queryFn: () => organizationsApi.getRecommended(12),
    enabled: !isSearching,
    staleTime: 60_000,
  });

  const isLoading = isSearching ? searchQuery.isLoading : recommendedQuery.isLoading;
  const orgs: OrganizationCard[] = isSearching
    ? (searchQuery.data ?? [])
    : (recommendedQuery.data ?? []);

  return (
    <>
      <main className="min-h-screen bg-[#f7f7fb] xl:pl-72">
        <UserSidebar userName={auth.user?.username ?? auth.user?.email ?? "User"} />

        {/* Header + Search bar */}
        <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            <div className="flex flex-1 items-center gap-3">
              <form
                onSubmit={(e) => e.preventDefault()}
                className="relative w-full max-w-xl"
              >
                {searchQuery.isFetching || recommendedQuery.isFetching ? (
                  <Loader2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-indigo-400" />
                ) : (
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                )}
                <Input
                  autoFocus
                  placeholder="Cari organisasi, universitas, atau deskripsi..."
                  className="h-12 rounded-full border-neutral-300 bg-white pl-12 shadow-none focus-visible:ring-indigo-400"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={() => setInputValue("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    ✕
                  </button>
                )}
              </form>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="mx-auto max-w-5xl px-4 py-8">
          {/* Section heading */}
          <div className="mb-6 flex items-center gap-2">
            <Compass className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-neutral-900">
              {isSearching
                ? `Hasil pencarian "${debouncedQuery}"`
                : "Rekomendasi Organisasi"}
            </h2>
            {!isLoading && (
              <span className="ml-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                {orgs.length}
              </span>
            )}
          </div>

          {/* Skeleton */}
          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <OrgCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && orgs.length === 0 && (
            <div className="rounded-3xl border bg-white px-6 py-16 text-center shadow-sm">
              <Search className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
              <h3 className="text-lg font-bold text-neutral-800">
                {isSearching
                  ? "Tidak ada organisasi yang cocok"
                  : "Belum ada organisasi"}
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
                {isSearching
                  ? `Coba kata kunci lain untuk "${debouncedQuery}".`
                  : "Organisasi yang terdaftar akan muncul di sini."}
              </p>
            </div>
          )}

          {/* Grid */}
          {!isLoading && orgs.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {orgs.map((org) => (
                <OrgCard key={org.id} org={org} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
