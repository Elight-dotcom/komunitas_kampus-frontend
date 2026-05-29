import { useQuery } from "@tanstack/react-query";
import { Building2, CalendarDays, Loader2, Users, FileText, ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

import { organizationsApi, type OrganizationDetail } from "@/api/organizations/organizations.api";
import { postsApi } from "@/api/posts/posts.api";
import { DynamicJoinButton } from "@/components/membership/DynamicJoinButton";
import { PostCard } from "@/components/posts/PostCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserSidebar } from "@/components/layouts/UserSidebar";
import { useAuthStore } from "@/stores/auth/auth.store";
import type { Post } from "@/types/posts/post.types";

function OrgProfileSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Banner */}
      <Skeleton className="h-48 md:h-64 w-full" />
      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-16 md:-mt-20 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 pb-8 border-b">
          <Skeleton className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white" />
          <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-12 w-40 rounded-full" />
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <div>
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#f7f7fb] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Organisasi Tidak Ditemukan</h2>
        <p className="text-neutral-600 mb-6">Organisasi yang kamu cari tidak tersedia.</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-700 text-white rounded-full font-medium hover:bg-indigo-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>
      </div>
    </div>
  );
}

export default function OrganizationProfilePage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const auth = useAuthStore();

  const { data: org, isLoading: orgLoading, isError } = useQuery({
    queryKey: ["organizations", "detail", orgId],
    queryFn: () => organizationsApi.getById(orgId!),
    enabled: Boolean(orgId),
    staleTime: 30_000,
  });

  // For now, show all posts from this org in recent order
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["organizations", orgId, "posts"],
    queryFn: () => postsApi.getFeed(orgId!, 1, 10),
    enabled: Boolean(orgId),
    staleTime: 30_000,
  });

  if (orgLoading) {
    return (
      <main className="min-h-screen bg-[#f7f7fb]">
        <UserSidebar userName={auth.user?.username ?? auth.user?.email ?? "User"} />
        <OrgProfileSkeleton />
      </main>
    );
  }

  if (isError || !org) {
    return (
      <main className="min-h-screen bg-[#f7f7fb]">
        <UserSidebar userName={auth.user?.username ?? auth.user?.email ?? "User"} />
        <NotFoundState onBack={() => navigate("/user/explore")} />
      </main>
    );
  }

  const initials = org.organizationName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Banner gradient when no banner URL
  const bannerBg = "bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500";

  return (
    <main className="min-h-screen bg-[#f7f7fb] xl:pl-72">
      <UserSidebar userName={auth.user?.username ?? auth.user?.email ?? "User"} />

      {/* Hero / Banner Section */}
      <div className="w-full bg-surface">
        {/* Banner */}
        <div className="h-48 md:h-64 w-full relative overflow-hidden">
          {org.bannerUrl ? (
            <img
              src={org.bannerUrl}
              alt={`${org.organizationName} banner`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${bannerBg}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Profile Info Container */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6 -mt-16 md:-mt-20 pb-6 md:pb-8 border-b border-neutral-200">
            {/* Avatar */}
            <Avatar className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white bg-white shadow-lg shrink-0 z-10">
              {org.avatarUrl ? (
                <img
                  src={org.avatarUrl}
                  alt={org.organizationName}
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-3xl md:text-4xl rounded-full">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>

            {/* Title and Actions */}
            <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 w-full z-10 pt-4 md:pt-0">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
                  {org.organizationName}
                </h1>
                <p className="mt-1 text-sm md:text-base text-neutral-500 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  {org.university}
                </p>
                <p className="mt-0.5 text-xs md:text-sm text-neutral-400">
                  @{org.slug}
                </p>
              </div>

              {/* Join Button */}
              <DynamicJoinButton orgId={org.id} className="shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-6 md:mt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Column (Left, spans 2) */}
          <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">
            {/* About Section */}
            <section className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 md:p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">i</span>
                Tentang Kami
              </h2>
              {org.description ? (
                <p className="text-neutral-600 leading-relaxed whitespace-pre-line">
                  {org.description}
                </p>
              ) : (
                <p className="text-neutral-400 italic">
                  Belum ada deskripsi untuk organisasi ini.
                </p>
              )}
            </section>

            {/* Recent Posts Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900">Postingan Terbaru</h2>
            </div>

            {/* Posts */}
            {postsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-2xl" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center shadow-sm">
                <FileText className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
                <h3 className="text-lg font-bold text-neutral-800">Belum Ada Postingan</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
                  Postingan dari organisasi ini akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {posts.map((post: Post) => (
                  <PostCard
                    key={post.id}
                    orgId={org.id}
                    post={post}
                    isOwnerAdmin={false}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Side Column (Right, spans 1) */}
          <div className="flex flex-col gap-6">
            {/* Stats Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 md:p-6 flex flex-col gap-4">
              <h3 className="text-base font-bold text-neutral-900">Statistik Komunitas</h3>

              <div className="flex items-center gap-4 py-3 border-b border-neutral-100">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-neutral-900">{org.memberCount}</div>
                  <div className="text-xs text-neutral-500">Anggota Aktif</div>
                </div>
              </div>

              <div className="flex items-center gap-4 py-3 border-b border-neutral-100">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-neutral-900">{org.postCount}</div>
                  <div className="text-xs text-neutral-500">Total Postingan</div>
                </div>
              </div>

              <div className="flex items-center gap-4 py-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-neutral-900">
                    {new Date(org.createdAt).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-neutral-500">Dibuat</div>
                </div>
              </div>
            </div>

            {/* Tags / Info */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 md:p-6">
              <h3 className="text-base font-bold text-neutral-900 mb-3">Informasi</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Badge variant="secondary" className="font-normal">@{org.slug}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Building2 className="h-4 w-4 text-neutral-400" />
                  <span>{org.university}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}