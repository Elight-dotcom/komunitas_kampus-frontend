import { httpClient } from "@/api/common/http-client";
import type {
  ApiResponse,
  CreatePostPayload,
  CreatePostResponse,
  DeletePostResponse,
  Post,
  PostMedia,
  PostMediaType,
  PresignedUploadUrlResponse,
  TogglePinResponse,
  UpdatePostPayload,
} from "@/types/posts/post.types";

type RawRecord = Record<string, unknown>;

function toStringValue(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function toNumberValue(value: unknown, fallback = 0) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function toBooleanValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return fallback;
}

function normalizeMedia(raw: RawRecord): PostMedia {
  return {
    id: toStringValue(raw.id),
    postId: toStringValue(raw.postId ?? raw.post_id),
    mediaType: (raw.mediaType ?? raw.media_type ?? "Image") as PostMedia["mediaType"],
    fileUrl: toStringValue(raw.fileUrl ?? raw.file_url),
    fileSizeBytes: toNumberValue(raw.fileSizeBytes ?? raw.file_size_bytes),
    orderIndex: toNumberValue(raw.orderIndex ?? raw.order_index),
    status: (raw.status ?? "Ready") as PostMedia["status"],
  };
}

export function normalizePost(raw: RawRecord): Post {
  const rawMedia =
    (raw.media as RawRecord[] | undefined) ??
    (raw.mediaItems as RawRecord[] | undefined) ??
    (raw.postMedia as RawRecord[] | undefined) ??
    [];

  return {
    id: toStringValue(raw.id),
    organizationId: toStringValue(raw.organizationId ?? raw.organization_id),
    organizationName: toStringValue(
      raw.organizationName ?? raw.organization_name,
      "Komunitas Kampus"
    ),
    organizationAvatarUrl: (raw.organizationAvatarUrl ?? raw.avatarUrl ?? null) as string | null,
    title: toStringValue(raw.title),
    caption: (raw.caption ?? null) as string | null,
    isPinned: toBooleanValue(raw.isPinned ?? raw.is_pinned),
    pinOrder:
      raw.pinOrder === null || raw.pin_order === null
        ? null
        : toNumberValue(raw.pinOrder ?? raw.pin_order, 0) || null,
    visibility: (raw.visibility ?? "Public") as Post["visibility"],
    likeCount: toNumberValue(raw.likeCount ?? raw.like_count),
    commentCount: toNumberValue(raw.commentCount ?? raw.comment_count),
    shareCount: toNumberValue(raw.shareCount ?? raw.share_count),
    createdAt: toStringValue(raw.createdAt ?? raw.created_at, new Date().toISOString()),
    updatedAt: (raw.updatedAt ?? raw.updated_at ?? null) as string | null,
    media: rawMedia.map(normalizeMedia).sort((left, right) => left.orderIndex - right.orderIndex),
  };
}

function unwrap<T>(response: ApiResponse<T>) {
  return response.data;
}

function normalizeCreatePostResponse(raw: RawRecord): CreatePostResponse {
  return {
    post: normalizePost((raw.post ?? raw) as RawRecord),
    uploads: (raw.uploads as CreatePostResponse["uploads"]) ?? [],
  };
}

export const postsApi = {
  async getFeed(orgId: string, page = 1, pageSize = 10): Promise<Post[]> {
    const response = await httpClient.get<ApiResponse<RawRecord[]>>(
      `/api/organizations/${orgId}/posts`,
      { params: { page, pageSize } }
    );

    return unwrap(response.data).map(normalizePost);
  },

  async getPostById(orgId: string, postId: string): Promise<Post> {
    const response = await httpClient.get<ApiResponse<RawRecord>>(
      `/api/organizations/${orgId}/posts/${postId}`
    );

    return normalizePost(unwrap(response.data));
  },

  async getPresignedUrl(
    orgId: string,
    fileName: string,
    mediaType: PostMediaType,
    fileSize: number
  ): Promise<PresignedUploadUrlResponse> {
    const response = await httpClient.post<ApiResponse<PresignedUploadUrlResponse>>(
      `/api/organizations/${orgId}/posts/presigned-url`,
      {
        fileName,
        mediaType,
        fileSize,
      }
    );

    return unwrap(response.data);
  },

  async createPost(orgId: string, payload: CreatePostPayload): Promise<CreatePostResponse> {
    const response = await httpClient.post<ApiResponse<RawRecord>>(
      `/api/organizations/${orgId}/posts`,
      payload
    );

    return normalizeCreatePostResponse(unwrap(response.data));
  },

  async updatePost(orgId: string, postId: string, payload: UpdatePostPayload): Promise<Post> {
    const response = await httpClient.put<ApiResponse<RawRecord>>(
      `/api/organizations/${orgId}/posts/${postId}`,
      payload
    );

    return normalizePost(unwrap(response.data));
  },

  async deletePost(orgId: string, postId: string): Promise<DeletePostResponse> {
    const response = await httpClient.delete<ApiResponse<DeletePostResponse>>(
      `/api/organizations/${orgId}/posts/${postId}`
    );

    return unwrap(response.data);
  },

  async togglePin(
    orgId: string,
    postId: string,
    payload: { isPinned: boolean; pinOrder?: number | null }
  ): Promise<TogglePinResponse> {
    const response = await httpClient.patch<ApiResponse<TogglePinResponse>>(
      `/api/organizations/${orgId}/posts/${postId}/pin`,
      payload
    );

    return unwrap(response.data);
  },

  async toggleLike(orgId: string, postId: string): Promise<void> {
    await httpClient.post(`/api/organizations/${orgId}/posts/${postId}/like`);
  },
};
