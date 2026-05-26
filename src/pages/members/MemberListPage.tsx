import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, History, Loader2, Search, UserPlus, UsersRound, X } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { membershipApi } from "@/api/membership/membership.api";
import { InviteMemberModal } from "@/components/membership";
import { OrgSidebar } from "@/components/layouts/OrgSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Membership, SentInvitation, MemberRequest } from "@/types/membership/membership.types";
import { normalizeMembershipStatus } from "@/types/membership/membership.types";
import { useAuthStore } from "@/stores/auth/auth.store";

type Tab = "members" | "requests";

function getInitials(value?: string | null) {
  return (value || "MB")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatTimeAgo(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes <= 1 ? "Baru saja" : `${diffMinutes} menit lalu`;
  }

  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Kemarin";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

// ─── Member Card ──────────────────────────────────────────────────────────────
function MemberCard({ member }: { member: Membership }) {
  const initials = getInitials(member.fullName ?? member.username);

  return (
    <div className="flex items-center justify-between p-4 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border border-neutral-200 shrink-0">
          <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900 truncate">
            {member.fullName ?? "Mahasiswa"}
          </p>
          <p className="text-xs text-neutral-500 truncate">
            @{member.username ?? "-"} · {member.email ?? "-"}
          </p>
        </div>
      </div>
      <Badge variant="secondary" className="text-xs font-medium shrink-0">
        Member
      </Badge>
    </div>
  );
}

// ─── Sent Invitation Item ─────────────────────────────────────────────────────
function SentInvitationItem({ invitation }: { invitation: SentInvitation }) {
  const status = normalizeMembershipStatus(invitation.status);
  const initials = getInitials(invitation.fullName ?? invitation.username);

  const statusBadgeClass = () => {
    if (status === "accepted") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    if (status === "pending") return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    return "bg-red-50 text-red-700 ring-red-200";
  };

  const statusLabel = () => {
    if (status === "accepted") return "Diterima";
    if (status === "pending") return "Tertunda";
    return "Ditolak";
  };

  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl hover:bg-neutral-50 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-neutral-100 text-neutral-600 font-semibold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900 truncate">
              {invitation.fullName ?? "@" + invitation.username}
            </p>
            <p className="text-xs text-neutral-400 truncate">
              {invitation.email ?? "-"}
            </p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${statusBadgeClass()}`}
        >
          {statusLabel()}
        </Badge>
      </div>
      <p className="text-[10px] text-neutral-400 ml-10">
        {invitation.resolvedAt
          ? formatRelativeTime(invitation.resolvedAt)
          : `Dikirim ${formatRelativeTime(invitation.requestedAt)}`}
      </p>
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({
  request,
  onAccept,
  onReject,
  isLoading,
}: {
  request: MemberRequest;
  onAccept: (membershipId: string) => void;
  onReject: (membershipId: string) => void;
  isLoading: boolean;
}) {
  const initials = getInitials(request.fullName ?? request.username);

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 to-indigo-400 opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex flex-col gap-4">
        {/* User Info */}
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 shrink-0 border-2 border-indigo-100">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-base">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-bold text-neutral-900">
              {request.fullName ?? "Mahasiswa"}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
              @{request.username ?? "-"} · {request.university ?? "-"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wide">
                Request
              </Badge>
              <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(request.requestedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Motive */}
        <div className="rounded-xl bg-neutral-50 p-3">
          <p className="text-sm text-neutral-600 leading-relaxed italic line-clamp-2">
            "{request.fullName ?? request.username ?? "Pengguna"} ingin bergabung dengan organisasi ini."
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            disabled={isLoading}
            onClick={() => onReject(request.membershipId)}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            Tolak
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            disabled={isLoading}
            onClick={() => onAccept(request.membershipId)}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Terima
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MemberListPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const auth = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [search, setSearch] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const membersQuery = useQuery({
    queryKey: ["membership", "members", orgId],
    queryFn: () => membershipApi.getMembers(orgId!),
    enabled: Boolean(orgId),
  });

  const requestsQuery = useQuery({
    queryKey: ["membership", "requests", orgId],
    queryFn: () => membershipApi.getPendingRequests(orgId!),
    enabled: Boolean(orgId),
  });

  const sentInvitationsQuery = useQuery({
    queryKey: ["membership", "sent-invitations", orgId],
    queryFn: () => membershipApi.getSentInvitations(orgId!),
    enabled: Boolean(orgId),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      membershipId,
      action,
    }: {
      membershipId: string;
      action: "accept" | "reject";
    }) => membershipApi.resolveRequest(orgId!, membershipId, { action }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["membership", "requests", orgId] });
      const previousRequests = queryClient.getQueryData<MemberRequest[]>(["membership", "requests", orgId]);
      queryClient.setQueryData<MemberRequest[]>(
        ["membership", "requests", orgId],
        (oldData) => (oldData ?? []).filter((r) => r.membershipId !== variables.membershipId)
      );
      return { previousRequests };
    },
    onSuccess: async (_result, variables) => {
      toast.success(variables.action === "accept" ? "Request berhasil diterima." : "Request berhasil ditolak.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["membership", "requests", orgId] }),
        queryClient.invalidateQueries({ queryKey: ["membership", "members", orgId] }),
      ]);
    },
    onError: (_err, _vars, context) => {
      toast.error("Gagal memproses request.");
      if (context?.previousRequests) {
        queryClient.setQueryData(["membership", "requests", orgId], context.previousRequests);
      }
    },
  });

  const isActionLoading = (membershipId: string) =>
    resolveMutation.isPending && resolveMutation.variables?.membershipId === membershipId;

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return membersQuery.data ?? [];
    return (membersQuery.data ?? []).filter((m) =>
      [m.fullName, m.username, m.email].filter(Boolean).some((v) => v!.toLowerCase().includes(keyword))
    );
  }, [membersQuery.data, search]);

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return requestsQuery.data ?? [];
    return (requestsQuery.data ?? []).filter((r) =>
      [r.fullName, r.username, r.university].filter(Boolean).some((v) => v!.toLowerCase().includes(keyword))
    );
  }, [requestsQuery.data, search]);

  if (!orgId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7fb] p-4">
        <Card>
          <div className="p-6 text-sm text-neutral-600">Organization ID tidak ditemukan.</div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7fb] xl:pl-72">
      <OrgSidebar
        orgId={orgId}
        isAdmin={true}
        userName={auth.user?.username ?? auth.user?.email ?? undefined}
        userRole="organisasi"
        onCreatePost={() => navigate(`/organizations/${orgId}/home`)}
      />

      {/* Sticky Header */}
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <h1 className="text-xl font-bold text-neutral-950">Manajemen Anggota</h1>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("members")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === "members"
                  ? "bg-indigo-800 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <UsersRound className="h-4 w-4" />
              Anggota
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {membersQuery.data?.length ?? 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === "requests"
                  ? "bg-indigo-800 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <Clock className="h-4 w-4" />
              Request
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {requestsQuery.data?.length ?? 0}
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari..."
              className="h-10 rounded-full border-neutral-200 bg-white pl-10 shadow-none"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* ANGGOTA TAB */}
        {activeTab === "members" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Members List */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <Card className="overflow-hidden rounded-2xl border-neutral-200">
                <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-5 py-4">
                  <h2 className="flex items-center gap-2 text-base font-bold text-neutral-900">
                    <UsersRound className="h-5 w-5 text-indigo-600" />
                    Anggota Aktif
                  </h2>
                </div>

                {membersQuery.isLoading ? (
                  <div className="divide-y divide-neutral-100 p-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-2 w-48" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
                      <UsersRound className="h-7 w-7 text-neutral-400" />
                    </div>
                    <h2 className="text-base font-bold text-neutral-800">
                      {search ? "Tidak ada hasil" : "Belum ada anggota"}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      {search ? `Tidak ada yang cocok dengan "${search}"` : "Anggota aktif organisasi akan tampil di sini."}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[480px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                    {filteredMembers.map((member) => (
                      <MemberCard key={member.id} member={member} />
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Invite + History */}
            <div className="flex flex-col gap-6">
              <Card className="rounded-2xl border-neutral-200 p-5">
                <div className="mb-4">
                  <h3 className="flex items-center gap-2 text-base font-bold text-neutral-900">
                    <UserPlus className="h-5 w-5 text-indigo-600" />
                    Undang Anggota Baru
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">Tambahkan mahasiswa via username.</p>
                </div>
                <Button onClick={() => setIsInviteOpen(true)} className="w-full bg-indigo-800 hover:bg-indigo-900">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Undang via Username
                </Button>
              </Card>

              <Card className="flex flex-1 flex-col overflow-hidden rounded-2xl border-neutral-200">
                <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-5 py-4">
                  <h3 className="flex items-center gap-2 text-base font-bold text-neutral-900">
                    <History className="h-5 w-5 text-neutral-500" />
                    Riwayat Undangan
                  </h3>
                </div>

                {sentInvitationsQuery.isLoading ? (
                  <div className="flex flex-col gap-2 p-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex flex-col gap-2 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-2 w-32" />
                          </div>
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sentInvitationsQuery.data?.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center py-8 text-center">
                    <p className="text-sm text-neutral-500">Belum ada undangan yang dikirim.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: "thin" }}>
                    {sentInvitationsQuery.data?.map((inv) => (
                      <SentInvitationItem key={inv.membershipId} invitation={inv} />
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* REQUEST TAB */}
        {activeTab === "requests" && (
          <div>
            {requestsQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="p-5">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-14 w-14 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-52" />
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                      </div>
                    </div>
                    <Skeleton className="mt-4 h-10 w-full rounded-xl bg-neutral-50" />
                    <div className="mt-4 flex gap-3">
                      <Skeleton className="h-10 flex-1 rounded-lg" />
                      <Skeleton className="h-10 flex-1 rounded-lg" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-3xl border border-neutral-200 bg-white px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                  <Clock className="h-8 w-8 text-indigo-700" />
                </div>
                <h2 className="text-lg font-bold text-neutral-950">
                  {search ? "Tidak ada hasil" : "Tidak ada request baru"}
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
                  {search ? `Tidak ada request yang cocok dengan "${search}".` : "Request dari mahasiswa akan muncul di sini."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRequests.map((request) => (
                  <RequestCard
                    key={request.membershipId}
                    request={request}
                    onAccept={(membershipId) =>
                      resolveMutation.mutate({ membershipId, action: "accept" })
                    }
                    onReject={(membershipId) =>
                      resolveMutation.mutate({ membershipId, action: "reject" })
                    }
                    isLoading={isActionLoading(request.membershipId)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <InviteMemberModal orgId={orgId} open={isInviteOpen} onOpenChange={setIsInviteOpen} />
    </main>
  );
}