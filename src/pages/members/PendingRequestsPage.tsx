import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Inbox, Loader2, X } from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { membershipApi } from "@/api/membership/membership.api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MemberRequest } from "@/types/membership.types";

function getInitials(value?: string | null) {
  return (value || "RQ")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function PendingRequestsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ["membership", "requests", orgId],
    queryFn: () => membershipApi.getPendingRequests(orgId!),
    enabled: Boolean(orgId),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ membershipId, action }: { membershipId: string; action: "accept" | "reject" }) =>
      membershipApi.resolveRequest(orgId!, membershipId, { action }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["membership", "requests", orgId] });

      const previousRequests = queryClient.getQueryData<MemberRequest[]>([
        "membership",
        "requests",
        orgId,
      ]);

      queryClient.setQueryData<MemberRequest[]>(["membership", "requests", orgId], (oldData) =>
        (oldData ?? []).filter((request) => request.membershipId !== variables.membershipId)
      );

      return { previousRequests };
    },
    onSuccess: async (_result, variables) => {
      toast.success(
        variables.action === "accept" ? "Request berhasil diterima." : "Request berhasil ditolak."
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["membership", "requests", orgId] }),
        queryClient.invalidateQueries({ queryKey: ["membership", "members", orgId] }),
      ]);
    },
    onError: (_error, _variables, context) => {
      toast.error("Gagal memproses request.");

      if (context?.previousRequests) {
        queryClient.setQueryData(["membership", "requests", orgId], context.previousRequests);
      }
    },
  });

  const isActionLoading = (request: MemberRequest) => {
    return (
      resolveMutation.isPending &&
      resolveMutation.variables?.membershipId === request.membershipId
    );
  };

  if (!orgId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7fb] p-4">
        <Card>
          <CardContent className="p-6 text-sm text-neutral-600">
            Organization ID tidak ditemukan di route.
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7fb] px-4 py-6">
      <section className="mx-auto max-w-4xl space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-950">Permintaan Bergabung</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Terima atau tolak mahasiswa yang meminta bergabung ke organisasi.
          </p>
        </div>

        {requestsQuery.isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        )}

        {!requestsQuery.isLoading && requestsQuery.data?.length === 0 && (
          <Card className="rounded-3xl border-neutral-200">
            <CardContent className="py-14 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                <Inbox className="h-8 w-8 text-indigo-700" />
              </div>
              <h2 className="text-lg font-bold text-neutral-950">Tidak ada request baru</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
                Join request mahasiswa akan muncul di halaman ini.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {requestsQuery.data?.map((request) => (
            <Card key={request.membershipId} className="rounded-2xl border-neutral-200">
              <CardHeader className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{getInitials(request.fullName ?? request.username)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-neutral-950">
                      {request.fullName ?? "Mahasiswa"}
                    </p>
                    <p className="text-sm text-neutral-500">
                      @{request.username ?? "-"} · {request.university ?? "Universitas tidak tersedia"}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      Request pada {formatDate(request.requestedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 sm:justify-end">
                  <Button
                    size="icon"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={isActionLoading(request)}
                    onClick={() =>
                      resolveMutation.mutate({ membershipId: request.membershipId, action: "accept" })
                    }
                  >
                    {isActionLoading(request) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    disabled={isActionLoading(request)}
                    onClick={() =>
                      resolveMutation.mutate({ membershipId: request.membershipId, action: "reject" })
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
