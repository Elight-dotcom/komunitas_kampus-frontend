import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { interactionsApi } from "@/api/interactions/interactions.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  CommentDto,
  ModerateCommentResult,
} from "@/types/interaction.types";

const PREDEFINED_REASONS = [
  "Spam/Iklan",
  "Tidak Relevan",
  "Kata-kata Kasar/SARA",
] as const;

interface ModerateCommentModalProps {
  postId: string;
  comment: CommentDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: ModerateCommentResult) => void;
}

export function ModerateCommentModal({
  postId,
  comment,
  open,
  onOpenChange,
  onSuccess,
}: ModerateCommentModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(
    PREDEFINED_REASONS[0],
  );
  const [customReason, setCustomReason] = useState("");

  const finalReason = useMemo(() => {
    const trimmedCustomReason = customReason.trim();

    return trimmedCustomReason.length > 0
      ? trimmedCustomReason
      : selectedReason;
  }, [customReason, selectedReason]);

  const reasonTooLong = finalReason.length > 150;

  const moderateMutation = useMutation({
    mutationFn: () => {
      if (!comment) {
        throw new Error("Komentar tidak ditemukan.");
      }

      return interactionsApi.moderateComment(postId, comment.id, finalReason);
    },
    onSuccess: (result) => {
      toast.success("Komentar berhasil dimoderasi.");
      onSuccess?.(result);
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Gagal memoderasi komentar.");
    },
  });

  useEffect(() => {
    if (!open) {
      setSelectedReason(PREDEFINED_REASONS[0]);
      setCustomReason("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle>Hapus Komentar dengan Moderasi</DialogTitle>
          <DialogDescription>
            Komentar akan di-soft delete dan mahasiswa akan menerima notifikasi.
          </DialogDescription>
        </DialogHeader>

        {comment && (
          <div className="rounded-2xl border bg-neutral-50 p-3 text-sm text-neutral-700">
            <span className="font-semibold">@{comment.username ?? "user"}</span>
            <p className="mt-1 line-clamp-3">{comment.content}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Alasan cepat</Label>
            <select
              value={selectedReason}
              onChange={(event) => setSelectedReason(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              disabled={moderateMutation.isPending}
            >
              {PREDEFINED_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-reason">Alasan kustom opsional</Label>
            <Textarea
              id="custom-reason"
              value={customReason}
              onChange={(event) => setCustomReason(event.target.value)}
              maxLength={150}
              placeholder="Tulis alasan khusus jika alasan cepat kurang cocok..."
              disabled={moderateMutation.isPending}
            />
            <div
              className={`text-right text-xs ${
                reasonTooLong ? "text-red-600" : "text-neutral-500"
              }`}
            >
              {finalReason.length}/150
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={moderateMutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={
              moderateMutation.isPending ||
              finalReason.trim().length === 0 ||
              reasonTooLong
            }
            onClick={() => moderateMutation.mutate()}
          >
            {moderateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Konfirmasi Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
