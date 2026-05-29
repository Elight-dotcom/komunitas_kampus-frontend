import type { ApiResponse } from "@/types/auth";
import { httpClient } from "@/api/common/http-client";

export interface OrganizationCard {
  id: string;
  organizationName: string;
  slug: string;
  university: string;
  description: string | null;
  avatarUrl: string | null;
  memberCount: number;
  postCount: number;
}

export interface OrganizationDetail {
  id: string;
  organizationName: string;
  slug: string;
  university: string;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  memberCount: number;
  postCount: number;
  createdAt: string;
}

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === undefined || response.data === null) {
    throw new Error(response.message ?? "Terjadi kesalahan.");
  }
  return response.data as T;
}

export const organizationsApi = {
  async search(query: string, page = 1, pageSize = 20): Promise<OrganizationCard[]> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (query.trim()) params.set("q", query.trim());
    const res = await httpClient.get<ApiResponse<OrganizationCard[]>>(
      `/api/explore/organizations?${params}`
    );
    return unwrap(res.data);
  },

  async getRecommended(limit = 12): Promise<OrganizationCard[]> {
    const res = await httpClient.get<ApiResponse<OrganizationCard[]>>(
      `/api/explore/organizations/recommended?limit=${limit}`
    );
    return unwrap(res.data);
  },

  async getById(id: string): Promise<OrganizationDetail> {
    const res = await httpClient.get<ApiResponse<OrganizationDetail>>(
      `/api/explore/organizations/${id}`
    );
    return unwrap(res.data);
  },
};
