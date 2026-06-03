import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { chatApi } from "@/api/chatApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useAuthStore } from "@/stores/auth";
import { useChatStore } from "@/stores/chatStore";
import type { MessageDto } from "@/types/chat";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";

interface ConversationWindowProps {
  roomId: string;
}

const EMPTY_MESSAGES: MessageDto[] = [];

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`flex ${i > 2 ? "justify-end" : "justify-start"}`}
        >
          <div className="flex max-w-[70%] items-end gap-2">
            {i <= 2 && <Skeleton className="h-8 w-8 rounded-full" />}
            <div
              className={`rounded-lg px-4 py-2 ${i > 2 ? "bg-primary" : "bg-muted"}`}
            >
              <Skeleton className="mb-2 h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ConversationWindow({
  roomId,
}: ConversationWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const { userId, role } = useAuthStore();
  const messages = useChatStore(
    (state) => state.messages[roomId] ?? EMPTY_MESSAGES,
  );
  const setMessages = useChatStore((state) => state.setMessages);
  const markMessageDeleted = useChatStore((state) => state.markMessageDeleted);

  const { connection } = useChatSocket();

  const isOrganization =
    role?.toLowerCase() === "organization" ||
    role?.toLowerCase() === "organisasi";

  const messagesQuery = useQuery({
    queryKey: ["chat", "messages", roomId],
    queryFn: () => chatApi.getMessages(roomId, 1, 30),
  });

  useEffect(() => {
    if (messagesQuery.data?.items) {
      setMessages(roomId, messagesQuery.data.items);
    }
  }, [messagesQuery.data, roomId, setMessages]);

  useEffect(() => {
    chatApi.markAsRead(roomId).catch(console.error);
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleDelete = async (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!messageToDelete) return;

    try {
      await chatApi.deleteMessage(messageToDelete);
      markMessageDeleted(roomId, messageToDelete);
    } catch (error) {
      console.error("Failed to delete message:", error);
    } finally {
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  const canDelete = (message: MessageDto): boolean => {
    if (message.isDeleted) return false;
    return message.senderId === userId || isOrganization;
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {messagesQuery.isLoading && <LoadingSkeleton />}

          {!messagesQuery.isLoading && messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>Belum ada pesan dalam percakapan ini</p>
            </div>
          )}

          {!messagesQuery.isLoading &&
            messages.map((message) => (
              <MessageBubble
                key={message.messageId}
                message={message}
                onDelete={handleDelete}
                canDelete={canDelete(message)}
              />
            ))}

          <div ref={scrollRef} />
        </div>
      </div>

      <ChatInput roomId={roomId} connection={connection} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pesan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pesan ini? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
