import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle,
  Clock,
  Inbox,
  Mail,
  UserPlus,
  XCircle,
} from "lucide-react";

import { notificationsApi } from "@/api/notifications/notifications.api";
import { UserSidebar } from "@/components/layouts/UserSidebar";
import { OrgSidebar } from "@/components/layouts/OrgSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Notification } from "@/types/notification.types";
import {
  normalizeNotificationType,
  getNotificationMessage,
  getNotificationLabel,
} from "@/types/notification.types";
import { useAuthStore } from "@/stores/auth/auth.store";
import { useMemo } from "react";

type Tab = "all" | "requests" | "invitations";

function getNotificationIcon(type: string) {
  const t = normalizeNotificationType(type);
  switch (t) {
    case "join_request": return UserPlus;
    case "join_accepted": return CheckCircle;
    case "join_rejected": return XCircle;
    case "invite_sent": return Mail;
    case "invite_accepted": return CheckCircle;
    case "invite_rejected": return XCircle;
    default: return Bell;
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
function NotifCard({ notif }: { notif: Notification }) {
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

  return (
    <Card
      className={`rounded-2xl border transition-shadow hover:shadow-md ${
        notif.isRead ? "border-neutral-200 bg-white" : "border-indigo-200 bg-indigo-50/50"
      }`}
    >
      <div className="flex items-start gap-4 p-5">
        <div className={`shrink-0 rounded-full p-2 ${
          notif.isRead ? "bg-neutral-100" : "bg-indigo-100"
        }`}>
          <Icon className={`h-5 w-5 ${
            notif.isRead ? "text-neutral-500" : "text-indigo-600"
          }`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className={`text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
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
  const role = roleProp ?? auth.role ?? "Mahasiswa";

  const [activeTab, setActiveTab] = useState("all" as Tab);

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getNotifications(),
  });

  // Group notifications by tab
  const filteredNotifications = useMemo(() => {
    const all = notificationsQuery.data ?? [];

    if (activeTab === "requests") {
      return all.filter(
        (n) => normalizeNotificationType(n.type) === "join_request"
      );
    }

    if (activeTab === "invitations") {
      return all.filter(
        (n) =>
          normalizeNotificationType(n.type) === "invite_sent"
      );
    }

    return all;
  }, [notificationsQuery.data, activeTab]);

  const unreadCount = (notificationsQuery.data ?? []).filter((n) => !n.isRead).length;

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
        <UserSidebar userName={auth.user?.username ?? auth.user?.email ?? undefined} />
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
              {tab === "all" ? "Semua" : tab === "requests" ? "Request" : "Undangan"}
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
        {!notificationsQuery.isLoading && filteredNotifications.length === 0 && (
          <div className="rounded-3xl border border-neutral-200 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
              <Inbox className="h-8 w-8 text-indigo-700" />
            </div>
            <h2 className="text-lg font-bold text-neutral-950">
              {activeTab === "all" ? "Tidak ada notifikasi" : activeTab === "requests" ? "Tidak ada request" : "Tidak ada undangan"}
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
              <NotifCard key={notif.id} notif={notif} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default NotificationsPage;