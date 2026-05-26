import { httpClient } from "@/api/common/http-client";
import type { ApiResponse } from "@/types/auth";
import type { Notification } from "@/types/notification.types";
import type { Invitation } from "@/types/membership/membership.types";

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === undefined || response.data === null) {
    throw new Error(response.message ?? "Terjadi kesalahan.");
  }
  return response.data as T;
}

export const notificationsApi = {
  async getNotifications(): Promise<Notification[]> {
    const response = await httpClient.get<ApiResponse<Notification[]>>(
      "/api/notifications"
    );

    return unwrap(response.data);
  },

  async getInvitations(): Promise<Invitation[]> {
    const response = await httpClient.get<ApiResponse<Invitation[]>>("/api/invitations");

    return unwrap(response.data);
  },
};