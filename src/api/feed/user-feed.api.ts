import { httpClient } from "@/api/common/http-client";
import type { ApiResponse, Post } from "@/types/posts/post.types";
import { normalizePost } from "@/api/posts/posts.api";

type RawRecord = Record<string, unknown>;

function unwrap<T>(response: ApiResponse<T>) {
  return response.data;
}

export const userFeedApi = {
  async getGlobalFeed(page = 1, pageSize = 10): Promise<Post[]> {
    const response = await httpClient.get<ApiResponse<RawRecord[]>>(
      "/api/posts/global",
      { params: { page, pageSize } }
    );

    return unwrap(response.data).map(normalizePost);
  },

  async getFollowingFeed(page = 1, pageSize = 10): Promise<Post[]> {
    const response = await httpClient.get<ApiResponse<RawRecord[]>>(
      "/api/posts/following",
      { params: { page, pageSize } }
    );

    return unwrap(response.data).map(normalizePost);
  },

  async searchOrganizations(query: string): Promise<{ id: string; name: string; avatarUrl?: string | null }[]> {
    const response = await httpClient.get<ApiResponse<RawRecord[]>>(
      "/api/organizations/search",
      { params: { q: query } }
    );

    return unwrap(response.data).map((org) => ({
      id: String(org.id ?? org.organizationId ?? ""),
      name: String(org.name ?? org.organizationName ?? ""),
      avatarUrl: org.avatarUrl as string | null | undefined,
    }));
  },
};