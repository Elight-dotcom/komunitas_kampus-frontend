import { httpClient } from "@/api/common/http-client";
import type {
  ApiResponse,
  Invitation,
  MemberRequest,
  Membership,
  MembershipStatus,
  ResolveMembershipPayload,
  RespondInvitePayload,
  SendInvitePayload,
} from "@/types/membership.types";

function unwrap<T>(response: ApiResponse<T>) {
  return response.data;
}

export const membershipApi = {
  async sendJoinRequest(orgId: string): Promise<Membership> {
    const response = await httpClient.post<ApiResponse<Membership>>(
      `/api/organizations/${orgId}/join`
    );

    return unwrap(response.data);
  },

  async getMembershipStatus(orgId: string): Promise<MembershipStatus> {
    const response = await httpClient.get<ApiResponse<MembershipStatus>>(
      `/api/organizations/${orgId}/membership-status`
    );

    return unwrap(response.data);
  },

  async getInvitations(): Promise<Invitation[]> {
    const response = await httpClient.get<ApiResponse<Invitation[]>>("/api/invitations");

    return unwrap(response.data);
  },

  async respondToInvite(
    membershipId: string,
    payload: RespondInvitePayload
  ): Promise<Invitation> {
    const response = await httpClient.post<ApiResponse<Invitation>>(
      `/api/invitations/${membershipId}/respond`,
      payload
    );

    return unwrap(response.data);
  },

  async getMembers(orgId: string): Promise<Membership[]> {
    const response = await httpClient.get<ApiResponse<Membership[]>>(
      `/api/organizations/${orgId}/members`
    );

    return unwrap(response.data);
  },

  async getPendingRequests(orgId: string): Promise<MemberRequest[]> {
    const response = await httpClient.get<ApiResponse<MemberRequest[]>>(
      `/api/organizations/${orgId}/requests`
    );

    return unwrap(response.data);
  },

  async sendInvite(orgId: string, payload: SendInvitePayload): Promise<Invitation> {
    const response = await httpClient.post<ApiResponse<Invitation>>(
      `/api/organizations/${orgId}/invite`,
      payload
    );

    return unwrap(response.data);
  },

  async resolveRequest(
    orgId: string,
    membershipId: string,
    payload: ResolveMembershipPayload
  ): Promise<Membership> {
    const response = await httpClient.patch<ApiResponse<Membership>>(
      `/api/organizations/${orgId}/requests/${membershipId}`,
      payload
    );

    return unwrap(response.data);
  },
};
