import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { interactionsApi } from "@/api/interactions/interactions.api";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth/auth.store";

interface LikeButtonProps {
  postId: string;
  initialLikeCount: number;
  className?: string;
  onLikeCountChange?: (likeCount: number) => void;
}

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

export function LikeButton({
  postId,
  initialLikeCount,
  className,
  onLikeCountChange,
}: LikeButtonProps) {
  const auth = useAuthStore((state) => state) as any;
  const userId = auth.userId ?? auth.accountId ?? auth.user?.accountId ?? auth.user?.id;

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  const likeStatusQuery = useQuery({
    queryKey: ["interactions", "like-status", postId, userId],
    queryFn: () => interactionsApi.getLikeStatus(postId),
    enabled: Boolean(postId && userId),
    staleTime: 30_000,
  });

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  useEffect(() => {
    if (!likeStatusQuery.data) return;

    setIsLiked(likeStatusQuery.data.isLiked);
    setLikeCount(likeStatusQuery.data.likeCount);
    onLikeCountChange?.(likeStatusQuery.data.likeCount);
  }, [likeStatusQuery.data, onLikeCountChange]);

  const likeMutation = useMutation({
    mutationFn: interactionsApi.toggleLike,
    onMutate: async () => {
      const previousState = {
        isLiked,
        likeCount,
      };

      const nextIsLiked = !isLiked;
      const nextLikeCount = Math.max(0, likeCount + (nextIsLiked ? 1 : -1));

      setIsLiked(nextIsLiked);
      setLikeCount(nextLikeCount);
      onLikeCountChange?.(nextLikeCount);

      return previousState;
    },
    onSuccess: (result) => {
      setIsLiked(result.isLiked);
      setLikeCount(result.likeCount);
      onLikeCountChange?.(result.likeCount);
    },
    onError: (_error, _postId, context) => {
      if (context) {
        setIsLiked(context.isLiked);
        setLikeCount(context.likeCount);
        onLikeCountChange?.(context.likeCount);
      }

      toast.error("Gagal memperbarui like. Coba lagi.");
    },
  });

  const handleToggleLike = () => {
    if (!userId) {
      toast.error("Kamu harus login untuk memberi like.");
      return;
    }

    if (likeMutation.isPending) return;

    likeMutation.mutate(postId);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={likeMutation.isPending}
      onClick={handleToggleLike}
      className={`gap-2 px-0 font-semibold hover:bg-transparent ${
        isLiked ? "text-rose-600" : "text-neutral-800 hover:text-rose-600"
      } ${className ?? ""}`}
      aria-label={isLiked ? "Unlike post" : "Like post"}
    >
      {likeMutation.isPending ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <Heart className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`} />
      )}
      <span>{formatNumber(likeCount)}</span>
    </Button>
  );
}
