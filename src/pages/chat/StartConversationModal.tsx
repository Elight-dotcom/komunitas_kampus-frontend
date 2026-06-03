import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquarePlus, Search } from "lucide-react";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { chatApi } from "@/api/chatApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/common/use-debounce";
import { useChatStore } from "@/stores/chatStore";

const searchSchema = z.object({
  username: z
    .string()
    .min(1, "Username wajib diisi")
    .max(50, "Maksimal 50 karakter"),
});

type SearchFormData = z.infer<typeof searchSchema>;

interface StartConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StartConversationModal({
  isOpen,
  onClose,
}: StartConversationModalProps) {
  const queryClient = useQueryClient();
  const setActiveRoomId = useChatStore((state) => state.setActiveRoomId);

  const {
    control,
    register,
    reset,
    formState: { errors },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: { username: "" },
  });

  const watchedUsername = useWatch({ control, name: "username" }) || "";
  const debouncedUsername = useDebounce(watchedUsername.trim(), 400);

  const searchQuery = useQuery({
    queryKey: ["chat", "search-users", debouncedUsername],
    queryFn: () => chatApi.searchUsers(debouncedUsername, 10),
    enabled: debouncedUsername.length >= 2,
    retry: false,
  });

  const createDirectRoomMutation = useMutation({
    mutationFn: (targetAccountId: string) =>
      chatApi.initiateDirectMessage(targetAccountId),
    onSuccess: (room) => {
      if (room) {
        setActiveRoomId(room.roomId);
        queryClient.invalidateQueries({ queryKey: ["chat", "rooms"] });
        handleClose();
      }
    },
  });

  const results = useMemo(() => searchQuery.data || [], [searchQuery.data]);

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Mulai Percakapan Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Cari username</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                placeholder="Ketik username..."
                className="pl-9"
                {...register("username")}
              />
            </div>
            {errors.username && (
              <p className="text-sm text-destructive">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="h-[260px] overflow-y-auto rounded-md border">
            <div className="p-2">
              {searchQuery.isFetching && (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mencari user...
                </div>
              )}

              {!searchQuery.isFetching &&
                results.length === 0 &&
                debouncedUsername.length >= 2 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Tidak ada user yang cocok.
                  </div>
                )}

              {!searchQuery.isFetching &&
                results.map((user) => (
                  <button
                    key={user.accountId}
                    type="button"
                    onClick={() =>
                      createDirectRoomMutation.mutate(user.accountId)
                    }
                    className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition hover:bg-accent"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.avatarUrl ?? undefined}
                        alt={user.username}
                      />
                      <AvatarFallback>
                        {(user.fullName ?? user.username)
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {user.fullName ?? user.username}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        @{user.username}
                      </p>
                      {user.university && (
                        <p className="truncate text-xs text-muted-foreground">
                          {user.university}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button type="button" onClick={handleClose}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
