import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { postsApi } from "@/api/posts/posts.api";
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
import { Textarea } from "@/components/ui/textarea";
import type { Post } from "@/types/post.types";

interface EditPostModalProps {
  orgId: string;
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPostModal({ orgId, post, open, onOpenChange }: EditPostModalProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && post) {
      setTitle(post.title);
      setCaption(post.caption ?? "");
      setError(null);
    }

    if (!open) {
      setTitle("");
      setCaption("");
      setError(null);
    }
  }, [open, post]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!post) {
        throw new Error("Post tidak ditemukan.");
      }

      return postsApi.updatePost(orgId, post.id, {
        title: title.trim(),
        caption: caption.trim() ? caption.trim() : null,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["posts", "feed", orgId] }),
        post
          ? queryClient.invalidateQueries({ queryKey: ["posts", "detail", orgId, post.id] })
          : Promise.resolve(),
      ]);

      toast.success("Postingan berhasil diperbarui.");
      onOpenChange(false);
    },
    onError: (caughtError) => {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Gagal memperbarui postingan.";

      setError(message);
      toast.error(message);
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      setError("Judul wajib diisi.");
      toast.error("Judul wajib diisi.");
      return;
    }

    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Postingan</DialogTitle>
          <DialogDescription>
            Sesuai aturan FR-01, admin hanya boleh mengubah judul dan caption.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-post-title">Judul</Label>
            <Input
              id="edit-post-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={updateMutation.isPending}
              placeholder="Judul postingan"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-post-caption">Caption</Label>
            <Textarea
              id="edit-post-caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              disabled={updateMutation.isPending}
              placeholder="Caption postingan"
              className="min-h-32 resize-none"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={updateMutation.isPending || !title.trim()}
            className="bg-indigo-800 hover:bg-indigo-900"
          >
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
