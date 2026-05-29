import { useQuery } from "@tanstack/react-query";
import {
  Hash,
  Megaphone,
  MessageSquare,
  MessageSquarePlus,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { chatApi } from "@/api/chatApi";
import { membershipApi } from "@/api/membership/membership.api";
import { OrgSidebar } from "@/components/layouts/OrgSidebar";
import { UserSidebar } from "@/components/layouts/UserSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/common/useMediaQuery";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useAuthStore } from "@/stores/auth/auth.store";
import { useChatStore } from "@/stores/chatStore";
import type { ChatRoomSummaryDto } from "@/types/chat";
import ConversationWindow from "./ConversationWindow";
import { CreateSubGroupModal } from "./CreateSubGroupModal";
import { StartConversationModal } from "./StartConversationModal";

function formatMessageTime(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" });
}

function getUnreadBadgeContent(count: number): string {
  if (count > 99) return "99+";
  return count.toString();
}

interface RoomListItemProps {
  room: ChatRoomSummaryDto;
  isActive: boolean;
  onClick: () => void;
}

function RoomListItem({ room, isActive, onClick }: RoomListItemProps) {
  const unreadCount = useChatStore(
    (state) => state.unreadCounts[room.roomId] || 0,
  );

  const roomName =
    room.name || (room.roomType === "direct" ? "Direct Message" : "Room");
  const lastMessage = room.lastMessageContent || "Belum ada pesan";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-accent ${
        isActive ? "bg-accent" : ""
      }`}
    >
      <div className="flex shrink-0">
        {room.roomType === "direct" ? (
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {room.otherParticipantAvatar ? (
                <img
                  src={room.otherParticipantAvatar}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                "?"
              )}
            </AvatarFallback>
          </Avatar>
        ) : room.roomType === "main" ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Hash className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between">
          <p className="truncate font-medium">{roomName}</p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatMessageTime(room.lastMessageAt)}
          </span>
        </div>
        <p className="truncate text-sm text-muted-foreground">{lastMessage}</p>
      </div>

      {unreadCount > 0 && (
        <Badge className="shrink-0 rounded-full px-2" variant="destructive">
          {getUnreadBadgeContent(unreadCount)}
        </Badge>
      )}
    </button>
  );
}

export default function ChatDashboardPage() {
  const [isCreateSubGroupOpen, setIsCreateSubGroupOpen] = useState(false);
  const [isStartConversationOpen, setIsStartConversationOpen] = useState(false);

  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const setActiveRoomId = useChatStore((state) => state.setActiveRoomId);

  const { role, user } = useAuthStore();
  const organizationId = user?.organizationId as string | null;

  const isOrganization =
    role?.toLowerCase() === "organization" ||
    role?.toLowerCase() === "organisasi";

  const isMobile = useMediaQuery("(max-width: 767px)");

  useChatSocket();

  const roomsQuery = useQuery({
    queryKey: ["chat", "rooms"],
    queryFn: chatApi.getRooms,
    refetchInterval: false,
  });

  const membersQuery = useQuery({
    queryKey: ["organization", "members", organizationId],
    queryFn: () => membershipApi.getMembers(organizationId!),
    enabled: !!organizationId && isOrganization,
  });

  const sortedRooms = useMemo(() => {
    const rooms = roomsQuery.data || [];
    return [...rooms].sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [roomsQuery.data]);

  const showLeftPanel = !isMobile || activeRoomId === null;
  const showRightPanel = !isMobile || activeRoomId !== null;

  return (
    <main className="flex min-h-screen flex-col xl:flex-row xl:pl-72">
      {isOrganization ? (
        <OrgSidebar
          orgId={organizationId!}
          isAdmin={true}
          userName={user?.username}
          userRole={role}
          onCreatePost={() => {}}
        />
      ) : (
        <UserSidebar userName={user?.username} />
      )}
      <div className="flex flex-1 flex-col pt-16 xl:pt-0">
        <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">
          {showLeftPanel && (
            <aside className="flex w-full flex-col border-b md:w-80 md:border-b-0 md:border-r">
              <header className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-lg font-medium">Pesan</h2>
                <div className="flex gap-1">
                  {isOrganization ? (
                    <button
                      type="button"
                      onClick={() => setIsCreateSubGroupOpen(true)}
                      className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                      aria-label="Create sub-group"
                    >
                      <Plus className="h-[18px] w-[18px]" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsStartConversationOpen(true)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                    >
                      <MessageSquarePlus className="h-[18px] w-[18px]" />
                      Percakapan Baru
                    </button>
                  )}
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                    aria-label="Search"
                  >
                    <Search className="h-[18px] w-[18px]" />
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto">
                {roomsQuery.isLoading && (
                  <div className="space-y-1 p-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start gap-3 px-3 py-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!roomsQuery.isLoading && sortedRooms.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Belum ada percakapan
                  </div>
                )}

                {!roomsQuery.isLoading &&
                  sortedRooms.map((room) => (
                    <RoomListItem
                      key={room.roomId}
                      room={room}
                      isActive={activeRoomId === room.roomId}
                      onClick={() => setActiveRoomId(room.roomId)}
                    />
                  ))}
              </div>
            </aside>
          )}

          {showRightPanel && (
            <section className="flex flex-1 flex-col">
              {isMobile && activeRoomId && (
                <header className="flex items-center border-b px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setActiveRoomId(null)}
                    className="flex items-center text-sm font-medium hover:underline"
                  >
                    ← Kembali
                  </button>
                </header>
              )}

              {activeRoomId ? (
                <ConversationWindow roomId={activeRoomId} />
              ) : (
                <div className="flex flex-1 items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="mx-auto h-16 w-16 opacity-20" />
                    <p className="mt-4">
                      Pilih percakapan untuk mulai mengobrol
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {isOrganization && organizationId && (
        <CreateSubGroupModal
          isOpen={isCreateSubGroupOpen}
          onClose={() => setIsCreateSubGroupOpen(false)}
          members={(membersQuery.data || []).map((m) => ({
            accountId: m.accountId,
            username: m.username,
          }))}
        />
      )}

      {!isOrganization && (
        <StartConversationModal
          isOpen={isStartConversationOpen}
          onClose={() => setIsStartConversationOpen(false)}
        />
      )}
    </main>
  );
}
