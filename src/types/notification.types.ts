export interface Notification {
  id: string;
  recipientId: string;
  actorId: string | null;
  actorName: string | null;
  actorAvatarUrl: string | null;
  type: string;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType =
  | "join_request"      // user asks to join org
  | "join_accepted"    // org accepts user request
  | "join_rejected"     // org rejects user request
  | "invite_sent"      // org invites user
  | "invite_accepted"  // user accepts org invite
  | "invite_rejected"; // user rejects org invite

export function normalizeNotificationType(type: string): NotificationType {
  switch (type) {
    case "join_request": return "join_request";
    case "join_accepted": return "join_accepted";
    case "join_rejected": return "join_rejected";
    case "invite_sent": return "invite_sent";
    case "invite_accepted": return "invite_accepted";
    case "invite_rejected": return "invite_rejected";
    default: return "join_request";
  }
}

export function getNotificationLabel(type: NotificationType): string {
  switch (type) {
    case "join_request": return "Request Bergabung";
    case "join_accepted": return "Diterima";
    case "join_rejected": return "Ditolak";
    case "invite_sent": return "Undangan";
    case "invite_accepted": return "Undangan Diterima";
    case "invite_rejected": return "Undangan Ditolak";
  }
}

export function getNotificationMessage(notification: Notification): string {
  const actor = notification.actorName ?? "Someone";
  const type = normalizeNotificationType(notification.type);

  switch (type) {
    case "join_request":
      return `${actor} meminta untuk bergabung`;
    case "join_accepted":
      return `${actor} telah menerima request bergabung`;
    case "join_rejected":
      return `${actor} telah menolak request bergabung`;
    case "invite_sent":
      return `${actor} mengundang Anda untuk bergabung`;
    case "invite_accepted":
      return `Anda telah menerima undangan dari ${actor}`;
    case "invite_rejected":
      return `Anda telah menolak undangan dari ${actor}`;
  }
}

export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case "join_request": return "UserPlus";
    case "join_accepted": return "Check";
    case "join_rejected": return "X";
    case "invite_sent": return "Mail";
    case "invite_accepted": return "CheckCircle";
    case "invite_rejected": return "XCircle";
  }
}