import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Loader2, Inbox, Search, X } from "lucide-react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { membershipApi } from "@/api/membership/membership.api";
import { OrgSidebar } from "@/components/layouts/OrgSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { MemberRequest } from "@/types/membership/membership.types";
import { useAuthStore } from "@/stores/auth/auth.store";

function getInitials(value?: string | null) {
  return (value || "RQ")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
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

// ─── Request Card ─────────────────────────────────────────────────────────────
interface RequestCardProps {
  request: MemberRequest;
  onAccept: (membershipId: string) => void;
  onReject: (membershipId: string) => void;
  isActionLoading: (membershipId: string) => boolean;
}

function RequestCard({
  request,
  onAccept,
  onReject,
  isActionLoading: checkLoading,
}: RequestCardProps) {
  const initials = getInitials(request.fullName ?? request.username);
  const loading = checkLoading(request.membershipId);

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md">
      {/* Top gradient accent */}
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
              @{request.username ?? "-"} ·{" "}
              {request.university ?? "Universitas tidak tersedia"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="text-[10px] font-bold uppercase tracking-wide"
              >
                Request
              </Badge>
              <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(request.requestedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Motive / Description */}
        <div className="rounded-xl bg-neutral-50 p-3">
          <p className="text-sm text-neutral-600 leading-relaxed italic line-clamp-2">
            "{request.fullName ?? request.username ?? "Pengguna"} ingin bergabung
            dengan organisasi ini."
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            disabled={loading}
            onClick={() => onReject(request.membershipId)}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            Tolak
          </Button>

          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            disabled={loading}
            onClick={() => onAccept(request.membershipId)}
          >
            {loading ? (
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
export default function PendingRequestsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const auth = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const requestsQuery = useQuery({
    queryKey: ["membership", "requests", orgId],
    queryFn: () => membershipApi.getPendingRequests(orgId!),
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

      const previousRequests = queryClient.getQueryData<MemberRequest[]>([
        "membership",
        "requests",
        orgId,
      ]);

      queryClient.setQueryData<MemberRequest[]>(
        ["membership", "requests", orgId],
        (oldData) =>
          (oldData ?? []).filter(
            (request) => request.membershipId !== variables.membershipId
          )
      );

      return { previousRequests };
    },
    onSuccess: async (_result, variables) => {
      toast.success(
        variables.action === "accept"
          ? "Request berhasil diterima."
          : "Request berhasil ditolak."
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["membership", "requests", orgId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["membership", "members", orgId],
        }),
      ]);
    },
    onError: (_error, _variables, context) => {
      toast.error("Gagal memproses request.");

      if (context?.previousRequests) {
        queryClient.setQueryData(
          ["membership", "requests", orgId],
          context.previousRequests
        );
      }
    },
  });

  const isActionLoading = (membershipId: string) => {
    return (
      resolveMutation.isPending &&
      resolveMutation.variables?.membershipId === membershipId
    );
  };

  const filteredRequests = (requestsQuery.data ?? []).filter((request) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;

    return [request.fullName, request.username, request.university]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(keyword));
  });

  if (!orgId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7fb] p-4">
        <Card>
          <div className="p-6 text-sm text-neutral-600">
            Organization ID tidak ditemukan di route.
          </div>
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
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-950">
              Permintaan Bergabung
            </h1>
            <p className="hidden text-xs text-neutral-500 sm:block">
              Terima atau tolak mahasiswa yang minta bergabung.
            </p>
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau username..."
              className="h-10 rounded-full border-neutral-200 bg-white pl-10 shadow-none"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Loading Skeletons */}
        {requestsQuery.isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
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
        )}

        {/* Empty State */}
        {!requestsQuery.isLoading && filteredRequests.length === 0 && (
          <div className="rounded-3xl border border-neutral-200 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
              <Inbox className="h-8 w-8 text-indigo-700" />
            </div>
            <h2 className="text-lg font-bold text-neutral-950">
              {search ? "Tidak ada hasil" : "Tidak ada request baru"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
              {search
                ? `Tidak ada request yang cocok dengan "${search}".`
                : "Request dari mahasiswa akan muncul di halaman ini."}
            </p>
          </div>
        )}

        {/* Request Cards Grid */}
        {!requestsQuery.isLoading && filteredRequests.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.membershipId}
                request={request}
                onAccept={(membershipId) =>
                  resolveMutation.mutate({
                    membershipId,
                    action: "accept",
                  })
                }
                onReject={(membershipId) =>
                  resolveMutation.mutate({
                    membershipId,
                    action: "reject",
                  })
                }
                isActionLoading={isActionLoading}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
