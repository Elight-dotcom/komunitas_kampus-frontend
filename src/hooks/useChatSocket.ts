import { useAuthStore } from "@/stores/auth";
import { useChatStore } from "@/stores/chatStore";
import type { MessageDto } from "@/types/chat";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5029";
const CHAT_HUB_URL = `${API_BASE_URL}/hubs/chat`;

interface UseChatSocketResult {
  connection: HubConnection | null;
  isConnected: boolean;
}

export function useChatSocket(): UseChatSocketResult {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const appendMessage = useChatStore((state) => state.appendMessage);
  const clearUnreadCount = useChatStore((state) => state.clearUnreadCount);
  const setUnreadCount = useChatStore((state) => state.setUnreadCount);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const newConnection = new HubConnectionBuilder()
      .withUrl(CHAT_HUB_URL, {
        accessTokenFactory: () => accessToken,
        withCredentials: true,
      })
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    newConnection.on("ReceiveMessage", (message: MessageDto) => {
      appendMessage(message.roomId, message);

      if (message.roomId !== activeRoomId) {
        const currentCount = useChatStore.getState().unreadCounts[message.roomId] || 0;
        setUnreadCount(message.roomId, currentCount + 1);
      }
    });

    newConnection.on("RoomListUpdated", () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "rooms"] });
    });

    newConnection.on("ReadAcknowledged", (roomId: string) => {
      clearUnreadCount(roomId);
    });

    newConnection
      .start()
      .then(() => {
        setIsConnected(true);
        setConnection(newConnection);
      })
      .catch((err) => {
        console.error("SignalR Connection Error:", err);
        setIsConnected(false);
      });

    return () => {
      newConnection.stop().catch(console.error);
    };
  }, [accessToken, activeRoomId, appendMessage, clearUnreadCount, queryClient, setUnreadCount]);

  return { connection, isConnected };
}