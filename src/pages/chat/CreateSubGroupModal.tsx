import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { chatApi } from "@/api/chatApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useChatStore } from "@/stores/chatStore";
import type { CreateSubGroupRequest } from "@/types/chat";

const createSubGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Nama sub-grup wajib diisi")
    .max(100, "Maksimal 100 karakter"),
  isInviteOnly: z.boolean().default(false),
  memberAccountIds: z.array(z.string()).default([]),
});

type CreateSubGroupFormData = z.input<typeof createSubGroupSchema>;

interface CreateSubGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Array<{
    accountId: string;
    username: string | null;
  }>;
}

export function CreateSubGroupModal({
  isOpen,
  onClose,
  members,
}: CreateSubGroupModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const setActiveRoomId = useChatStore((state) => state.setActiveRoomId);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateSubGroupFormData>({
    resolver: zodResolver(createSubGroupSchema),
    defaultValues: {
      name: "",
      isInviteOnly: false,
      memberAccountIds: [],
    },
  });

  const selectedMembers = useWatch({ control, name: "memberAccountIds" });
  const isInviteOnly = useWatch({ control, name: "isInviteOnly" });

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter((m) => m.username?.toLowerCase().includes(query));
  }, [members, searchQuery]);

  const handleMemberToggle = (accountId: string) => {
    const current = selectedMembers || [];
    if (current.includes(accountId)) {
      setValue(
        "memberAccountIds",
        current.filter((id: string) => id !== accountId),
      );
    } else {
      setValue("memberAccountIds", [...current, accountId]);
    }
  };

  const onSubmit = async (data: CreateSubGroupFormData) => {
    setIsSubmitting(true);
    try {
      const request: CreateSubGroupRequest = {
        name: data.name,
        isInviteOnly: data.isInviteOnly ?? false,
        memberAccountIds: data.memberAccountIds ?? [],
      };
      const result = await chatApi.createSubGroup(request);
      if (result) {
        setActiveRoomId(result.roomId);
        queryClient.invalidateQueries({ queryKey: ["chat", "rooms"] });
      }
      reset();
      onClose();
    } catch (error) {
      console.error("Failed to create sub-group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSearchQuery("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Buat Sub-Grup</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Sub-Grup</Label>
            <Input
              id="name"
              placeholder="Masukkan nama sub-grup"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isInviteOnly">Undangan Saja</Label>
            <Switch
              id="isInviteOnly"
              checked={isInviteOnly ?? false}
              onCheckedChange={(checked: boolean) =>
                setValue("isInviteOnly", checked)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Tambah Anggota</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari anggota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="h-[240px] overflow-y-auto pr-4">
              <div className="space-y-2">
                {filteredMembers.map((member) => (
                  <label
                    key={member.accountId}
                    className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-accent"
                  >
                    <Checkbox
                      checked={
                        selectedMembers?.includes(member.accountId) ?? false
                      }
                      onCheckedChange={() =>
                        handleMemberToggle(member.accountId)
                      }
                    />
                    <Avatar className="h-7 w-7">
                      <AvatarFallback>
                        {member.username?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {member.username || "Unknown"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Buat Sub-Grup
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
