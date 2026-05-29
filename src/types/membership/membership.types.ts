export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]> | null;
};

export type MembershipStatusValue =
  | "Pending"
  | "Accepted"
  | "Rejected"
  | "pending"
  | "accepted"
  | "rejected"
  | "Approved"
  | "approved"
  | null;

export type MembershipInviteTypeValue =
  | "Request"
  | "Invite"
  | "request"
  | "invite"
  | null;

export interface Membership {
  id: string;
  accountId: string;
  organizationId: string;
  username: string | null;
  email: string | null;
  fullName: string | null;
  organizationName: string | null;
  status: MembershipStatusValue;
  inviteType: MembershipInviteTypeValue;
  requestedAt: string;
  resolvedAt: string | null;
}

export interface MemberRequest {
  membershipId: string;
  accountId: string;
  organizationId: string;
  username: string | null;
  email: string | null;
  fullName: string | null;
  university: string | null;
  status: MembershipStatusValue;
  inviteType: MembershipInviteTypeValue;
  requestedAt: string;
}

export interface Invitation {
  membershipId: string;
  accountId: string;
  organizationId: string;
  organizationName: string | null;
  university: string | null;
  status: MembershipStatusValue;
  inviteType: MembershipInviteTypeValue;
  requestedAt: string;
  resolvedAt: string | null;
}

export interface MembershipStatus {
  membershipId?: string | null;
  hasMembership: boolean;
  status: MembershipStatusValue;
  inviteType: MembershipInviteTypeValue;
  isInCooldown: boolean;
  canRequestAgainAt: string | null;
}

export interface SendInvitePayload {
  username: string;
}

export interface SentInvitation {
  membershipId: string;
  accountId: string;
  organizationId: string;
  username: string | null;
  email: string | null;
  fullName: string | null;
  university: string | null;
  status: MembershipStatusValue;
  requestedAt: string;
  resolvedAt: string | null;
}

export interface ResolveMembershipPayload {
  action: "accept" | "reject";
}

export interface RespondInvitePayload {
  action: "accept" | "reject";
}

export function normalizeMembershipStatus(
  value: MembershipStatusValue
): "pending" | "accepted" | "rejected" | null {
  if (!value) return null;

  const normalized = value.toLowerCase();

  if (normalized === "approved") return "accepted";
  if (normalized === "accepted") return "accepted";
  if (normalized === "pending") return "pending";
  if (normalized === "rejected") return "rejected";

  return null;
}

export function normalizeInviteType(
  value: MembershipInviteTypeValue
): "request" | "invite" | null {
  if (!value) return null;

  const normalized = value.toLowerCase();

  if (normalized === "request") return "request";
  if (normalized === "invite") return "invite";

  return null;
}

export function getRemainingCooldownDays(canRequestAgainAt: string | null) {
  if (!canRequestAgainAt) return 3;

  const targetDate = new Date(canRequestAgainAt);
  const diffMs = targetDate.getTime() - Date.now();

  if (diffMs <= 0) return 0;

  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
