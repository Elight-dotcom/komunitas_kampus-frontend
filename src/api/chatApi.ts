import { httpClient } from "@/api/common";
import type { ApiResponse } from "@/types/auth";
import type {
    ChatRoomDto,
    ChatRoomSummaryDto,
    ChatUserSearchResult,
    CreateDirectRoomRequest,
    CreateSubGroupRequest,
    MessageDto,
    PagedResult,
} from "@/types/chat";

export const chatApi = {
  getRooms: () =>
    httpClient.get<ApiResponse<ChatRoomSummaryDto[]>>("/api/chat/rooms")
      .then((response) => response.data.data),

  getMessages: (roomId: string, page = 1, pageSize = 30) =>
    httpClient.get<ApiResponse<PagedResult<MessageDto>>>(`/api/chat/rooms/${roomId}/messages`, {
      params: { page, pageSize },
    }).then((response) => response.data.data),

  initiateDirectMessage: (targetAccountId: string) =>
    httpClient.post<ApiResponse<ChatRoomDto>>("/api/chat/rooms/direct", {
      targetAccountId,
    } as CreateDirectRoomRequest).then((response) => response.data.data),

  searchUsers: (username: string, limit = 10) =>
    httpClient.get<ApiResponse<ChatUserSearchResult[]>>("/api/chat/users/search", {
      params: { username, limit },
    }).then((response) => response.data.data),

  createSubGroup: (data: CreateSubGroupRequest) =>
    httpClient.post<ApiResponse<ChatRoomDto>>("/api/chat/rooms/sub-group", data)
      .then((response) => response.data.data),

  deleteMessage: (messageId: string) =>
    httpClient.delete(`/api/chat/messages/${messageId}`),

  markAsRead: (roomId: string) =>
    httpClient.post(`/api/chat/rooms/${roomId}/read`),
};