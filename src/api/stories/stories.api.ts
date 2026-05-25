import { httpClient } from "@/api/common/http-client";
import type {
  ApiResponse,
  CreateStoryPayload,
  MarkStoryViewedResponse,
  Story,
  StoryGroup,
  StoryMediaType,
  StoryPresignedUploadUrlResponse,
} from "@/types/story.types";

function unwrap<T>(response: ApiResponse<T>) {
  return response.data;
}

export const storiesApi = {
  async getActiveStories(): Promise<StoryGroup[]> {
    const response = await httpClient.get<ApiResponse<StoryGroup[]>>(
      "/api/stories",
    );

    return unwrap(response.data);
  },

  async getStoryById(storyId: string): Promise<Story> {
    const response = await httpClient.get<ApiResponse<Story>>(
      `/api/stories/${storyId}`,
    );

    return unwrap(response.data);
  },

  async getPresignedUrl(
    orgId: string,
    fileName: string,
    mediaType: StoryMediaType,
    fileSize: number,
  ): Promise<StoryPresignedUploadUrlResponse> {
    const response = await httpClient.post<
      ApiResponse<StoryPresignedUploadUrlResponse>
    >(`/api/organizations/${orgId}/stories/presigned-url`, {
      fileName,
      mediaType,
      fileSize,
    });

    return unwrap(response.data);
  },

  async createStory(
    orgId: string,
    payload: CreateStoryPayload,
  ): Promise<Story> {
    const response = await httpClient.post<ApiResponse<Story>>(
      `/api/organizations/${orgId}/stories`,
      payload,
    );

    return unwrap(response.data);
  },

  async markStoryViewed(storyId: string): Promise<MarkStoryViewedResponse> {
    const response = await httpClient.post<ApiResponse<MarkStoryViewedResponse>>(
      `/api/stories/${storyId}/view`,
    );

    return unwrap(response.data);
  },
};
