import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Send, UserRound } from "lucide-react";
import { toast } from "sonner";

import { membershipApi } from "@/api/membership/membership.api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InviteMemberModalProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useDebouncedValue<T>(value: T, delayMs = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}

export function InviteMemberModal({ orgId, open, onOpenChange }: InviteMemberModalProps) {
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");
  const debouncedUsername = useDebouncedValue(username.trim(), 300);

  const searchResult = useMemo(() => {
    if (debouncedUsername.length < 3) return null;

    return {
      username: debouncedUsername,
      fullName: debouncedUsername,
      university: "Klik untuk mengirim undangan",
    };
  }, [debouncedUsername]);

  const inviteMutation = useMutation({
    mutationFn: (targetUsername: string) =>
      membershipApi.sendInvite(orgId, { username: targetUsername }),
    onSuccess: async () => {
      toast.success(`Undangan berhasil dikirim ke @${username.trim()}.`);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["membership", "members", orgId] }),
        queryClient.invalidateQueries({ queryKey: ["membership", "requests", orgId] }),
      ]);

      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal mengirim undangan. Pastikan username benar.";

      toast.error(message);
    },
  });

  useEffect(() => {
    if (!open) {
      setUsername("");
    }
  }, [open]);

  const handleInvite = (targetUsername: string) => {
    if (!targetUsername.trim()) {
      toast.error("Username wajib diisi.");
      return;
    }

    inviteMutation.mutate(targetUsername.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Undang Anggota</DialogTitle>
          <DialogDescription>
            Masukkan username mahasiswa. Input memakai debounce 300ms sebelum preview ditampilkan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-username">Username Mahasiswa</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                id="invite-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Contoh: egit"
                className="pl-10"
                disabled={inviteMutation.isPending}
              />
            </div>
            <p className="text-xs text-neutral-500">
              Endpoint search account belum tersedia. Preview di bawah memakai username yang diketik, lalu invite dikirim ke endpoint resmi.
            </p>
          </div>

          <div className="rounded-2xl border bg-neutral-50 p-3">
            {!searchResult ? (
              <div className="py-6 text-center text-sm text-neutral-500">
                Ketik minimal 3 karakter username.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleInvite(searchResult.username)}
                disabled={inviteMutation.isPending}
                className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-neutral-200 transition hover:ring-indigo-300"
              >
                <Avatar>
                  <AvatarFallback>
                    {searchResult.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-950">
                    @{searchResult.username}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {searchResult.university}
                  </p>
                </div>
                {inviteMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-700" />
                ) : (
                  <Send className="h-5 w-5 text-indigo-700" />
                )}
              </button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={inviteMutation.isPending}
          >
            Batal
          </Button>
          <Button
            onClick={() => handleInvite(username)}
            disabled={inviteMutation.isPending || username.trim().length < 3}
            className="bg-indigo-800 hover:bg-indigo-900"
          >
            {inviteMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserRound className="mr-2 h-4 w-4" />
            )}
            Kirim Undangan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
