import { useMutation } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { interactionsApi } from "@/api/interactions/interactions.api";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth/auth.store";
import { SharePlatform } from "@/types/interaction/interaction.types";

interface ShareButtonProps {
  postId: string;
  initialShareCount: number;
  shareUrl: string;
  title?: string;
  text?: string | null;
  className?: string;
  onShareCountChange?: (shareCount: number) => void;
}

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

export function ShareButton({
  postId,
  initialShareCount,
  shareUrl,
  title,
  text,
  className,
  onShareCountChange,
}: ShareButtonProps) {
  const auth = useAuthStore((state) => state) as any;
  const userId =
    auth.userId ?? auth.accountId ?? auth.user?.accountId ?? auth.user?.id;

  const [shareCount, setShareCount] = useState(initialShareCount);

  const shareMutation = useMutation({
    mutationFn: () => interactionsApi.sharePost(postId, SharePlatform.External),
    onSuccess: async (result) => {
      setShareCount(result.shareCount);
      onShareCountChange?.(result.shareCount);

      if (result.requiresAuth) {
        toast.info("Link ini hanya bisa dibuka oleh anggota organisasi.");
      }

      const payload = {
        title: title ?? "Postingan KomunitasKampus",
        text: text ?? "Lihat postingan ini di KomunitasKampus.",
        url: shareUrl,
      };

      try {
        if (navigator.share) {
          await navigator.share(payload);
          return;
        }

        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link disalin!");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;

        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link disalin!");
      }
    },
    onError: () => {
      toast.error("Gagal membagikan postingan.");
    },
  });

  const handleShare = () => {
    if (!userId) {
      toast.error("Kamu harus login untuk membagikan postingan.");
      return;
    }

    shareMutation.mutate();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={shareMutation.isPending}
      onClick={handleShare}
      className={`gap-2 px-0 font-semibold text-neutral-800 hover:bg-transparent hover:text-indigo-700 ${className ?? ""}`}
      aria-label="Share post"
    >
      {shareMutation.isPending ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <Send className="h-6 w-6" />
      )}
      <span>{formatNumber(shareCount)}</span>
    </Button>
  );
}
