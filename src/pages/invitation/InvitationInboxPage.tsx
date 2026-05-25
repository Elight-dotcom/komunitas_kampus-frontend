import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Inbox, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { membershipApi } from "@/api/membership/membership.api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Invitation } from "@/types/membership.types";

function getInitials(value?: string | null) {
  return (value || "ORG")
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

export default function InvitationInboxPage() {
  const queryClient = useQueryClient();

  const invitationsQuery = useQuery({
    queryKey: ["membership", "invitations"],
    queryFn: membershipApi.getInvitations,
  });

  const respondMutation = useMutation({
    mutationFn: ({ membershipId, action }: { membershipId: string; action: "accept" | "reject" }) =>
      membershipApi.respondToInvite(membershipId, { action }),
    onSuccess: async (result, variables) => {
      toast.success(
        variables.action === "accept"
          ? "Undangan berhasil diterima."
          : "Undangan berhasil ditolak."
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["membership", "invitations"] }),
        queryClient.invalidateQueries({ queryKey: ["membership", "status", result.organizationId] }),
      ]);
    },
    onError: () => {
      toast.error("Gagal memproses undangan.");
    },
  });

  const isActionLoading = (invitation: Invitation) => {
    return (
      respondMutation.isPending &&
      respondMutation.variables?.membershipId === invitation.membershipId
    );
  };

  return (
    <main className="min-h-screen bg-[#f7f7fb] px-4 py-6">
      <section className="mx-auto max-w-3xl space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-950">Kotak Masuk Undangan</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Terima atau tolak undangan organisasi kampus yang masuk.
          </p>
        </div>

        {invitationsQuery.isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        )}

        {!invitationsQuery.isLoading && invitationsQuery.data?.length === 0 && (
          <Card className="rounded-3xl border-neutral-200">
            <CardContent className="py-14 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                <Inbox className="h-8 w-8 text-indigo-700" />
              </div>
              <h2 className="text-lg font-bold text-neutral-950">Belum ada undangan</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
                Undangan dari organisasi akan tampil di halaman ini.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {invitationsQuery.data?.map((invitation) => (
            <Card key={invitation.membershipId} className="rounded-2xl border-neutral-200">
              <CardHeader className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{getInitials(invitation.organizationName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-neutral-950">
                      {invitation.organizationName ?? "Organisasi Kampus"}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {invitation.university ?? "Universitas tidak tersedia"}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      Diundang pada {formatDate(invitation.requestedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 sm:justify-end">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={isActionLoading(invitation)}
                    onClick={() =>
                      respondMutation.mutate({ membershipId: invitation.membershipId, action: "accept" })
                    }
                  >
                    {isActionLoading(invitation) ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Terima
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isActionLoading(invitation)}
                    onClick={() =>
                      respondMutation.mutate({ membershipId: invitation.membershipId, action: "reject" })
                    }
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak
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
