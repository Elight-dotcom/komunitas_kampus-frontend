import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle,
  Clock,
  Inbox,
  Loader2,
  Mail,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { membershipApi } from "@/api/membership/membership.api";
import { notificationsApi } from "@/api/notifications/notifications.api";
import { OrgSidebar } from "@/components/layouts/OrgSidebar";
import { UserSidebar } from "@/components/layouts/UserSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth/auth.store";
import type { Notification } from "@/types/notification.types";
import {
  getNotificationLabel,
  getNotificationMessage,
  normalizeNotificationType,
} from "@/types/notification.types";

type Tab = "all" | "requests" | "invitations";
type InviteAction = "accept" | "reject";

const INVITE_TYPES = new Set([
  "invite_sent",
  "invite_accepted",
  "invite_rejected",
]);

function isInviteType(type: string) {
  return INVITE_TYPES.has(normalizeNotificationType(type));
}

function getNotificationIcon(type: string) {
  const t = normalizeNotificationType(type);
  switch (t) {
    case "join_request":
      return UserPlus;
    case "join_accepted":
      return CheckCircle;
    case "join_rejected":
      return XCircle;
    case "invite_sent":
      return Mail;
    case "invite_accepted":
      return CheckCircle;
    case "invite_rejected":
      return XCircle;
    default:
      return Bell;
  }
}

function getNotifBadgeClass(type: string) {
  const t = normalizeNotificationType(type);
  switch (t) {
    case "join_accepted":
    case "invite_accepted":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "join_rejected":
    case "invite_rejected":
      return "bg-red-50 text-red-700 ring-red-200";
    default:
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
  }
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

// ─── Notification Card ─────────────────────────────────────────────────────
function NotifCard({
  notif,
  onRespondInvite,
  isResponding,
}: {
  notif: Notification;
  onRespondInvite?: (notif: Notification, action: InviteAction) => void;
  isResponding?: boolean;
}) {
  const Icon = getNotificationIcon(notif.type);
  const initials = (notif.actorName ?? "??")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const normalizedType = normalizeNotificationType(notif.type);
  const label = getNotificationLabel(normalizedType);
  const message = getNotificationMessage(notif);
  const badgeClass = getNotifBadgeClass(notif.type);
  const canRespond =
    normalizedType === "invite_sent" &&
    !!notif.referenceId &&
    !!onRespondInvite;

  return (
    <Card
      className={`rounded-2xl border transition-shadow hover:shadow-md ${
        notif.isRead
          ? "border-neutral-200 bg-white"
          : "border-indigo-200 bg-indigo-50/50"
      }`}
    >
      <div className="flex items-start gap-4 p-5">
        <div
          className={`shrink-0 rounded-full p-2 ${
            notif.isRead ? "bg-neutral-100" : "bg-indigo-100"
          }`}
        >
          <Icon
            className={`h-5 w-5 ${
              notif.isRead ? "text-neutral-500" : "text-indigo-600"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="secondary"
              className={`text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}
            >
              {label}
            </Badge>
            {!notif.isRead && (
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
            )}
          </div>
          <p className="text-sm text-neutral-900 font-medium leading-relaxed">
            {message}
          </p>
          <p className="mt-1 text-xs text-neutral-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(notif.createdAt)}
          </p>

          {canRespond && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isResponding}
                onClick={() => onRespondInvite(notif, "accept")}
              >
                {isResponding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Terima
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                disabled={isResponding}
                onClick={() => onRespondInvite(notif, "reject")}
              >
                {isResponding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Tolak
              </Button>
            </div>
          )}
        </div>

        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
interface NotificationsPageProps {
  role?: "Mahasiswa" | "Organisasi";
}

export function NotificationsPage({ role: roleProp }: NotificationsPageProps) {
  const auth = useAuthStore();
  const queryClient = useQueryClient();
  const role = roleProp ?? auth.role ?? "Mahasiswa";

  const [activeTab, setActiveTab] = useState("all" as Tab);

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getNotifications(),
  });

  const respondInviteMutation = useMutation({
    mutationFn: ({
      membershipId,
      action,
    }: {
      membershipId: string;
      action: InviteAction;
    }) => membershipApi.respondToInvite(membershipId, { action }),
    onSuccess: async (_, variables) => {
      toast.success(
        variables.action === "accept"
          ? "Undangan berhasil diterima."
          : "Undangan berhasil ditolak.",
      );

      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({
        queryKey: ["membership", "invitations"],
      });
    },
    onError: () => {
      toast.error("Gagal memproses undangan.");
    },
  });

  const handleRespondInvite = (notif: Notification, action: InviteAction) => {
    if (!notif.referenceId) {
      toast.error("ID undangan tidak tersedia.");
      return;
    }

    respondInviteMutation.mutate({
      membershipId: notif.referenceId,
      action,
    });
  };

  const displayNotifications = useMemo(() => {
    const all = [...(notificationsQuery.data ?? [])].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const inviteThreads = new Map<
      string,
      {
        sent: Notification | null;
        response: Notification | null;
      }
    >();
    const passthrough: Notification[] = [];

    for (const notification of all) {
      const type = normalizeNotificationType(notification.type);

      if (notification.referenceId && isInviteType(notification.type)) {
        const entry = inviteThreads.get(notification.referenceId) ?? {
          sent: null,
          response: null,
        };

        if (type === "invite_sent") {
          entry.sent = notification;
        } else {
          entry.response = notification;
        }

        inviteThreads.set(notification.referenceId, entry);
        continue;
      }

      passthrough.push(notification);
    }

    const threadedInvitations = Array.from(inviteThreads.values())
      .map(({ sent, response }) => response ?? sent)
      .filter(
        (notification): notification is Notification => notification !== null,
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return [...passthrough, ...threadedInvitations].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [notificationsQuery.data, activeTab]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "requests") {
      return displayNotifications.filter(
        (n) => normalizeNotificationType(n.type) === "join_request",
      );
    }

    if (activeTab === "invitations") {
      return displayNotifications.filter((n) => isInviteType(n.type));
    }

    return displayNotifications;
  }, [displayNotifications, activeTab]);

  const unreadCount = (notificationsQuery.data ?? []).filter(
    (n) => !n.isRead,
  ).length;

  return (
    <main className="min-h-screen bg-[#f7f7fb] xl:pl-72">
      {role === "Organisasi" ? (
        <OrgSidebar
          orgId={auth.user?.organizationId as string}
          isAdmin={true}
          userName={auth.user?.username ?? auth.user?.email ?? undefined}
          userRole="organisasi"
          onCreatePost={() => {}}
        />
      ) : (
        <UserSidebar
          userName={auth.user?.username ?? auth.user?.email ?? undefined}
        />
      )}

      {/* Sticky Header */}
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-950 flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-600" />
              Notifikasi
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-600 text-white text-xs font-bold px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="hidden text-xs text-neutral-500 sm:block">
              Request dan undangan organisasi
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto flex max-w-3xl px-4">
          {(["all", "requests", "invitations"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors capitalize ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-neutral-500 hover:border-neutral-300"
              }`}
            >
              {tab === "all"
                ? "Semua"
                : tab === "requests"
                  ? "Request"
                  : "Undangan"}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Loading */}
        {notificationsQuery.isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty */}
        {!notificationsQuery.isLoading &&
          filteredNotifications.length === 0 && (
            <div className="rounded-3xl border border-neutral-200 bg-white px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                <Inbox className="h-8 w-8 text-indigo-700" />
              </div>
              <h2 className="text-lg font-bold text-neutral-950">
                {activeTab === "all"
                  ? "Tidak ada notifikasi"
                  : activeTab === "requests"
                    ? "Tidak ada request"
                    : "Tidak ada undangan"}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
                {activeTab === "all"
                  ? "Request dan undangan akan muncul di sini."
                  : activeTab === "requests"
                    ? "Request bergabung dari mahasiswa akan muncul di sini."
                    : "Undangan dari organisasi akan muncul di sini."}
              </p>
            </div>
          )}

        {/* List */}
        {!notificationsQuery.isLoading && filteredNotifications.length > 0 && (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <NotifCard
                key={notif.id}
                notif={notif}
                onRespondInvite={handleRespondInvite}
                isResponding={
                  respondInviteMutation.isPending &&
                  respondInviteMutation.variables?.membershipId ===
                    notif.referenceId
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default NotificationsPage;
