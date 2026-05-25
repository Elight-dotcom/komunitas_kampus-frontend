import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  MailCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { membershipApi } from "@/api/membership/membership.api";
import { Button } from "@/components/ui/button";
import {
  getRemainingCooldownDays,
  normalizeInviteType,
  normalizeMembershipStatus,
} from "@/types/membership/membership.types";

interface DynamicJoinButtonProps {
  orgId: string;
  className?: string;
  /**
   * Optional fallback jika backend MembershipStatusDto sudah ditambah membershipId.
   * Tanpa membershipId, action accept/reject invite lebih aman dilakukan dari InvitationInboxPage.
   */
  inviteMembershipId?: string | null;
}

export function DynamicJoinButton({
  orgId,
  className,
  inviteMembershipId,
}: DynamicJoinButtonProps) {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ["membership", "status", orgId],
    queryFn: () => membershipApi.getMembershipStatus(orgId),
    enabled: Boolean(orgId),
  });

  const joinMutation = useMutation({
    mutationFn: () => membershipApi.sendJoinRequest(orgId),
    onSuccess: async () => {
      toast.success("Permintaan bergabung berhasil dikirim.");
      await queryClient.invalidateQueries({
        queryKey: ["membership", "status", orgId],
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal mengirim permintaan bergabung.";

      toast.error(message);
    },
  });

  const respondInviteMutation = useMutation({
    mutationFn: async (action: "accept" | "reject") => {
      const membershipId = statusQuery.data?.membershipId ?? inviteMembershipId;

      if (!membershipId) {
        throw new Error(
          "Membership id undangan belum tersedia. Buka halaman Invitation Inbox untuk menerima atau menolak undangan.",
        );
      }

      return membershipApi.respondToInvite(membershipId, { action });
    },
    onSuccess: async (result, action) => {
      toast.success(
        action === "accept"
          ? "Undangan berhasil diterima."
          : "Undangan berhasil ditolak.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["membership", "status", orgId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["membership", "invitations"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["membership", "members", result.organizationId],
        }),
      ]);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Gagal memproses undangan.";
      toast.error(message);
    },
  });

  if (statusQuery.isLoading) {
    return (
      <Button disabled className={className}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Memuat Status
      </Button>
    );
  }

  if (statusQuery.isError) {
    return (
      <Button
        variant="outline"
        className={className}
        onClick={() => statusQuery.refetch()}
      >
        Muat Ulang Status
      </Button>
    );
  }

  const status = statusQuery.data;
  const normalizedStatus = normalizeMembershipStatus(status?.status ?? null);
  const inviteType = normalizeInviteType(status?.inviteType ?? null);

  if (status?.isInCooldown) {
    const remainingDays = getRemainingCooldownDays(status.canRequestAgainAt);

    return (
      <Button disabled variant="secondary" className={className}>
        <Clock3 className="mr-2 h-4 w-4" />
        Coba lagi dalam {remainingDays} hari
      </Button>
    );
  }

  if (!status?.hasMembership || !normalizedStatus) {
    return (
      <Button
        className={className}
        onClick={() => joinMutation.mutate()}
        disabled={joinMutation.isPending}
      >
        {joinMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="mr-2 h-4 w-4" />
        )}
        Minta Bergabung
      </Button>
    );
  }

  if (normalizedStatus === "pending" && inviteType === "request") {
    return (
      <Button disabled variant="secondary" className={className}>
        <Clock3 className="mr-2 h-4 w-4" />
        Menunggu Persetujuan
      </Button>
    );
  }

  if (normalizedStatus === "pending" && inviteType === "invite") {
    return (
      <div className={`flex flex-col gap-2 sm:flex-row ${className ?? ""}`}>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={respondInviteMutation.isPending}
          onClick={() => respondInviteMutation.mutate("accept")}
        >
          {respondInviteMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MailCheck className="mr-2 h-4 w-4" />
          )}
          Terima Undangan
        </Button>
        <Button
          variant="destructive"
          disabled={respondInviteMutation.isPending}
          onClick={() => respondInviteMutation.mutate("reject")}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Tolak
        </Button>
      </div>
    );
  }

  if (normalizedStatus === "accepted") {
    return (
      <div
        className={`inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 ${className ?? ""}`}
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Anda Anggota Terdaftar
      </div>
    );
  }

  return (
    <Button
      className={className}
      onClick={() => joinMutation.mutate()}
      disabled={joinMutation.isPending}
    >
      {joinMutation.isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="mr-2 h-4 w-4" />
      )}
      Minta Bergabung
    </Button>
  );
}
