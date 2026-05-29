import { Trash2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MessageDto } from "@/types/chat";

interface MessageBubbleProps {
  message: MessageDto;
  onDelete: (messageId: string) => void;
  canDelete: boolean;
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({
  message,
  onDelete,
  canDelete,
}: MessageBubbleProps) {
  const isOwnMessage = message.isOwnMessage;
  const isDeleted = message.isDeleted;

  if (isDeleted) {
    return (
      <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[70%] rounded-lg bg-muted/50 px-4 py-2">
          <p className="select-none italic text-muted-foreground">
            Pesan ini telah dihapus
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatMessageTime(message.sentAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      {!isOwnMessage && (
        <Avatar className="mr-2 h-8 w-8 shrink-0">
          <AvatarFallback>
            {message.senderAvatarUrl ? (
              <img
                src={message.senderAvatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              message.senderUsername.charAt(0).toUpperCase()
            )}
          </AvatarFallback>
        </Avatar>
      )}

      {canDelete ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="group relative cursor-pointer">
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  isOwnMessage
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {!isOwnMessage && (
                  <p className="mb-1 text-xs text-muted-foreground">
                    {message.senderUsername}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="mt-1 text-right text-xs opacity-70">
                  {formatMessageTime(message.sentAt)}
                </p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(message.messageId)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus pesan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div
          className={`max-w-[70%] rounded-lg px-4 py-2 ${
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }`}
        >
          {!isOwnMessage && (
            <p className="mb-1 text-xs text-muted-foreground">
              {message.senderUsername}
            </p>
          )}
          <p className="whitespace-pre-wrap">{message.content}</p>
          <p className="mt-1 text-right text-xs opacity-70">
            {formatMessageTime(message.sentAt)}
          </p>
        </div>
      )}
    </div>
  );
}
