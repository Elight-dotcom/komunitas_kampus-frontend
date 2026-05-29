import type { MessageDto } from "@/types/chat";
import { create } from "zustand";

interface ChatStore {
  activeRoomId: string | null;
  setActiveRoomId: (roomId: string | null) => void;

  messages: Record<string, MessageDto[]>;
  appendMessage: (roomId: string, message: MessageDto) => void;
  setMessages: (roomId: string, messages: MessageDto[]) => void;
  markMessageDeleted: (roomId: string, messageId: string) => void;

  unreadCounts: Record<string, number>;
  setUnreadCount: (roomId: string, count: number) => void;
  clearUnreadCount: (roomId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  activeRoomId: null,
  setActiveRoomId: (roomId) => set({ activeRoomId: roomId }),

  messages: {},
  appendMessage: (roomId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] || []), message],
      },
    })),
  setMessages: (roomId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: messages,
      },
    })),
  markMessageDeleted: (roomId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: (state.messages[roomId] || []).map((msg) =>
          msg.messageId === messageId ? { ...msg, isDeleted: true, content: null } : msg
        ),
      },
    })),

  unreadCounts: {},
  setUnreadCount: (roomId, count) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [roomId]: count,
      },
    })),
  clearUnreadCount: (roomId) =>
    set((state) => {
      const newCounts = { ...state.unreadCounts };
      delete newCounts[roomId];
      return { unreadCounts: newCounts };
    }),
}));