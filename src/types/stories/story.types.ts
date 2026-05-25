export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]> | null;
};

export enum StoryMediaType {
  Image = 1,
  Video = 2,
  Text = 3,
}

export type StoryMediaTypeValue =
  | StoryMediaType
  | "Image"
  | "Video"
  | "Text"
  | "image"
  | "video"
  | "text";

export interface Story {
  id: string;
  organizationId: string;
  orgName: string;
  orgAvatar?: string | null;
  mediaType: StoryMediaTypeValue;
  mediaUrl?: string | null;
  textContent?: string | null;
  backgroundColor?: string | null;
  expiresAt: string;
  isViewed: boolean;
  createdAt?: string | null;
}

export interface StoryGroup {
  organizationId: string;
  orgName: string;
  orgAvatar?: string | null;
  hasUnviewed: boolean;
  stories: Story[];
}

export interface CreateStoryPayload {
  mediaType: StoryMediaType;
  fileKey?: string | null;
  textContent?: string | null;
  backgroundColor?: string | null;
}

export interface StoryPresignedUploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  mediaType: StoryMediaTypeValue;
  fileSize: number;
  expiresAt: string;
}

export interface MarkStoryViewedResponse {
  storyId: string;
  message: string;
}

export function normalizeStoryMediaType(
  value: StoryMediaTypeValue,
): "image" | "video" | "text" {
  if (typeof value === "number") {
    if (value === StoryMediaType.Video) return "video";
    if (value === StoryMediaType.Text) return "text";
    return "image";
  }

  const normalized = value.toLowerCase();

  if (normalized === "video") return "video";
  if (normalized === "text") return "text";

  return "image";
}

export function toStoryMediaTypeValue(
  value: "image" | "video" | "text",
): StoryMediaType {
  if (value === "video") return StoryMediaType.Video;
  if (value === "text") return StoryMediaType.Text;
  return StoryMediaType.Image;
}
