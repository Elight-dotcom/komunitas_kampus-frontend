export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]> | null;
};

export interface LikeStatus {
  isLiked: boolean;
  likeCount: number;
}

export interface CommentDto {
  id: string;
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  role: string | null;
  content: string | null;
  isDeleted: boolean;
  deletedReason: string | null;
  createdAt: string;
}

export interface Comment extends CommentDto {}

export enum SharePlatform {
  Internal = "internal",
  External = "external",
}

export interface ShareResult {
  shareCount: number;
  requiresAuth: boolean;
}

export interface ModerateCommentResult {
  postId: string;
  commentId: string;
  deletedReason: string;
  commentCount: number;
}

export type CommentAddedEventPayload = {
  postId: string;
  comment: CommentDto;
  commentCount?: number;
};

export type CommentModeratedEventPayload = {
  postId: string;
  commentId: string;
  isModerated?: boolean;
  deletedReason?: string | null;
  commentCount?: number;
};

export type LikeUpdatedEventPayload = {
  postId: string;
  actorId?: string;
  isLiked: boolean;
  likeCount: number;
};
