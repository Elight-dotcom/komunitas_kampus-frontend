import { Loader2, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { chatApi } from "@/api/chatApi";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/chatStore";

interface SendMessageButtonProps {
  targetAccountId: string;
  targetUsername: string;
}

export function SendMessageButton({
  targetAccountId,
  targetUsername,
}: SendMessageButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setActiveRoomId = useChatStore((state) => state.setActiveRoomId);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const room = await chatApi.initiateDirectMessage(targetAccountId);
      navigate("/chat");
      setTimeout(() => {
        if (room) {
          setActiveRoomId(room.roomId);
        }
      }, 100);
    } catch (error) {
      console.error("Failed to initiate direct message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={isLoading} size="sm">
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="mr-2 h-4 w-4" />
      )}
      Kirim Pesan
    </Button>
  );
}
