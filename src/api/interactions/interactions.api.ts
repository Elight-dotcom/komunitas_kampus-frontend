import { httpClient } from "@/api/common/http-client";
import type {
  ApiResponse,
  CommentDto,
  LikeStatus,
  ModerateCommentResult,
  SharePlatform,
  ShareResult,
} from "@/types/interaction.types";

function unwrap<T>(response: ApiResponse<T>) {
  return response.data;
}

export const interactionsApi = {
  async toggleLike(postId: string): Promise<LikeStatus> {
    const response = await httpClient.post<ApiResponse<LikeStatus>>(
      `/api/posts/${postId}/like`,
    );

    return unwrap(response.data);
  },

  async getLikeStatus(postId: string): Promise<LikeStatus> {
    const response = await httpClient.get<ApiResponse<LikeStatus>>(
      `/api/posts/${postId}/like-status`,
    );

    return unwrap(response.data);
  },

  async getComments(
    postId: string,
    page = 1,
    pageSize = 20,
  ): Promise<CommentDto[]> {
    const response = await httpClient.get<ApiResponse<CommentDto[]>>(
      `/api/posts/${postId}/comments`,
      {
        params: {
          page,
          pageSize,
        },
      },
    );

    return unwrap(response.data);
  },

  async createComment(postId: string, content: string): Promise<CommentDto> {
    const response = await httpClient.post<ApiResponse<CommentDto>>(
      `/api/posts/${postId}/comments`,
      { content },
    );

    return unwrap(response.data);
  },

  async deleteOwnComment(postId: string, commentId: string): Promise<void> {
    await httpClient.delete<ApiResponse<unknown>>(
      `/api/posts/${postId}/comments/${commentId}`,
    );
  },

  async moderateComment(
    postId: string,
    commentId: string,
    deletedReason: string,
  ): Promise<ModerateCommentResult> {
    const response = await httpClient.delete<ApiResponse<ModerateCommentResult>>(
      `/api/posts/${postId}/comments/${commentId}/moderate`,
      {
        data: {
          deletedReason,
        },
      },
    );

    return unwrap(response.data);
  },

  async sharePost(postId: string, platform: SharePlatform): Promise<ShareResult> {
    const response = await httpClient.post<ApiResponse<ShareResult>>(
      `/api/posts/${postId}/share`,
      {
        platform,
      },
    );

    return unwrap(response.data);
  },
};
