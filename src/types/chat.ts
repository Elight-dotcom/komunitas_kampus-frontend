export type RoomType = 'main' | 'sub' | 'direct';

export interface ChatRoomSummaryDto {
  roomId: string;
  name: string | null;
  roomType: RoomType;
  isMainGroup: boolean;
  lastMessageContent: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  otherParticipantAvatar: string | null;
}

export interface ChatRoomDto {
  roomId: string;
  name: string | null;
  roomType: RoomType;
  isMainGroup: boolean;
  isInviteOnly: boolean;
  organizationId: string | null;
  createdAt: string;
}

export interface MessageDto {
  messageId: string;
  roomId: string;
  senderId: string;
  senderUsername: string;
  senderAvatarUrl: string | null;
  content: string | null;
  isDeleted: boolean;
  sentAt: string;
  isOwnMessage: boolean;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
}

export interface CreateDirectRoomRequest {
  targetAccountId: string;
}

export interface ChatUserSearchResult {
  accountId: string;
  username: string;
  fullName: string | null;
  university: string | null;
  avatarUrl: string | null;
}

export interface CreateSubGroupRequest {
  name: string;
  isInviteOnly: boolean;
  memberAccountIds: string[];
}