export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]> | null;
};

export enum PostVisibility {
  Internal = 1,
  Private = 2,
  Public = 3,
}

export enum PostMediaType {
  Image = 1,
  Video = 2,
  Document = 3,
}

export enum PostMediaStatus {
  Loading = 1,
  Ready = 2,
}

export type VisibilityValue =
  | PostVisibility
  | "Private"
  | "Internal"
  | "Public"
  | "private"
  | "internal"
  | "public";

export type MediaTypeValue =
  | PostMediaType
  | "Image"
  | "Video"
  | "Document"
  | "image"
  | "video"
  | "document";

export type MediaStatusValue =
  | PostMediaStatus
  | "Loading"
  | "Ready"
  | "loading"
  | "ready";

export interface PostMedia {
  id: string;
  postId?: string;
  mediaType: MediaTypeValue;
  fileUrl: string;
  fileSizeBytes: number;
  orderIndex: number;
  status: MediaStatusValue;
}

export interface Post {
  id: string;
  organizationId: string;
  organizationName?: string;
  organizationAvatarUrl?: string | null;
  title: string;
  caption?: string | null;
  isPinned: boolean;
  pinOrder?: number | null;
  visibility: VisibilityValue;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt?: string | null;
  media: PostMedia[];
}

export interface PresignedUploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  mediaType: MediaTypeValue;
  fileSize: number;
  expiresAt: string;
}

export interface CreatePostMediaItemPayload {
  fileKey: string;
  mediaType: PostMediaType;
  fileSize: number;
  orderIndex: number;
}

export interface CreatePostPayload {
  title: string;
  caption: string | null;
  visibility: PostVisibility;
  isPinned: boolean;
  pinOrder: number | null;
  mediaItems: CreatePostMediaItemPayload[];
}

export interface CreatePostResponse {
  post: Post;
  uploads?: Array<{
    fileName: string;
    mediaType: MediaTypeValue;
    orderIndex: number;
    uploadUrl: string;
  }>;
}

export interface UpdatePostPayload {
  title: string;
  caption: string | null;
}

export interface DeletePostResponse {
  postId: string;
  message: string;
}

export interface TogglePinResponse {
  postId: string;
  isPinned: boolean;
  pinOrder?: number | null;
}

export function normalizeVisibility(value: VisibilityValue): "private" | "internal" | "public" {
  if (typeof value === "number") {
    if (value === PostVisibility.Private) return "private";
    if (value === PostVisibility.Internal) return "internal";
    return "public";
  }

  const normalized = value.toLowerCase();

  if (normalized === "private") return "private";
  if (normalized === "internal") return "internal";
  return "public";
}

export function normalizeMediaType(value: MediaTypeValue): "image" | "video" | "document" {
  if (typeof value === "number") {
    if (value === PostMediaType.Video) return "video";
    if (value === PostMediaType.Document) return "document";
    return "image";
  }

  const normalized = value.toLowerCase();

  if (normalized === "video") return "video";
  if (normalized === "document") return "document";
  return "image";
}

export function normalizeMediaStatus(value: MediaStatusValue): "loading" | "ready" {
  if (typeof value === "number") {
    return value === PostMediaStatus.Loading ? "loading" : "ready";
  }

  return value.toLowerCase() === "loading" ? "loading" : "ready";
}
