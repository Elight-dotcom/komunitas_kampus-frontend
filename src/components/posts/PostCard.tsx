import { useMutation } from "@tanstack/react-query";
import {
  Bookmark,
  Eye,
  FileText,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Send,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { postsApi } from "@/api/posts/posts.api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { Post, PostMedia } from "@/types/posts/post.types";
import {
  normalizeMediaStatus,
  normalizeMediaType,
  normalizeVisibility,
} from "@/types/posts/post.types";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PostCardProps {
  orgId: string;
  post: Post;
  isOwnerAdmin: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  onTogglePin?: (post: Post) => void;
}

function getInitials(name?: string) {
  return (name || "KK")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatPostTime(value: string) {
  const createdAt = new Date(value);
  const diffMs = Date.now() - createdAt.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(createdAt);
}

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

function resolveFileUrl(fileUrl: string) {
  if (!fileUrl) return "";

  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }

  const publicBaseUrl = import.meta.env.VITE_MINIO_PUBLIC_BASE_URL as
    | string
    | undefined;

  if (!publicBaseUrl) {
    return fileUrl;
  }

  return `${publicBaseUrl.replace(/\/$/, "")}/${fileUrl.replace(/^\//, "")}`;
}

function visibilityBadgeClassName(visibility: Post["visibility"]) {
  const normalized = normalizeVisibility(visibility);

  if (normalized === "private") {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }

  if (normalized === "internal") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  return "bg-indigo-50 text-indigo-700 ring-indigo-200";
}

function visibilityLabel(visibility: Post["visibility"]) {
  const normalized = normalizeVisibility(visibility);
  return normalized[0].toUpperCase() + normalized.slice(1);
}

function LoadingMediaPlaceholder() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center border-y bg-neutral-50 px-6 py-10 text-center">
      <Skeleton className="mb-4 h-14 w-14 rounded-full" />
      <p className="text-sm font-semibold text-neutral-800">
        Video sedang diproses...
      </p>
      <p className="mt-1 max-w-sm text-xs text-neutral-500">
        File sudah masuk, tetapi video baru bisa diputar setelah proses
        transcode selesai.
      </p>
    </div>
  );
}

function ImageGrid({ media }: { media: PostMedia[] }) {
  const visibleMedia = media.slice(0, 3);
  const extraCount = media.length - visibleMedia.length;

  return (
    <div className="grid grid-cols-1 gap-1 bg-neutral-100 sm:grid-cols-3">
      {visibleMedia.map((item, index) => (
        <div
          key={item.id || item.fileUrl}
          className="relative aspect-square overflow-hidden bg-neutral-100"
        >
          <img
            src={resolveFileUrl(item.fileUrl)}
            alt={`Post media ${index + 1}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {index === 2 && extraCount > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-3xl font-bold text-white">
              +{extraCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VideoMedia({ item }: { item: PostMedia }) {
  if (normalizeMediaStatus(item.status) === "loading") {
    return <LoadingMediaPlaceholder />;
  }

  return (
    <video
      src={resolveFileUrl(item.fileUrl)}
      controls
      className="max-h-[72vh] w-full bg-black object-contain"
    />
  );
}

function DocumentMedia({ item }: { item: PostMedia }) {
  if (normalizeMediaStatus(item.status) === "loading") {
    return <LoadingMediaPlaceholder />;
  }

  return (
    <div className="border-y bg-slate-50">
      <div className="mx-5 my-4 overflow-hidden rounded-xl border bg-white">
        <div className="flex items-center justify-between border-b bg-slate-100 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
            <FileText className="h-5 w-5 text-red-600" />
            Dokumen PDF
          </div>
          <span className="text-xs text-neutral-500">
            {formatNumber(Math.round(item.fileSizeBytes / 1024))} KB
          </span>
        </div>
        <div className="flex max-h-[460px] justify-center overflow-auto p-4">
          <Document
            file={resolveFileUrl(item.fileUrl)}
            loading={<Skeleton className="h-96 w-72 rounded-xl" />}
            error={
              <div className="p-8 text-center text-sm text-neutral-500">
                PDF belum bisa ditampilkan. Pastikan file URL publik MinIO sudah
                benar.
              </div>
            }
          >
            <Page pageNumber={1} width={340} />
          </Document>
        </div>
      </div>
    </div>
  );
}

function MediaArea({ media }: { media: PostMedia[] }) {
  const sortedMedia = [...media].sort((a, b) => a.orderIndex - b.orderIndex);

  if (sortedMedia.length === 0) {
    return null;
  }

  if (
    sortedMedia.some((item) => normalizeMediaStatus(item.status) === "loading")
  ) {
    return <LoadingMediaPlaceholder />;
  }

  const firstItem = sortedMedia[0];
  const mediaType = normalizeMediaType(firstItem.mediaType);

  if (mediaType === "image") {
    return (
      <ImageGrid
        media={sortedMedia.filter(
          (item) => normalizeMediaType(item.mediaType) === "image",
        )}
      />
    );
  }

  if (mediaType === "video") {
    return <VideoMedia item={firstItem} />;
  }

  return <DocumentMedia item={firstItem} />;
}

export function PostCard({
  orgId,
  post,
  isOwnerAdmin,
  onEdit,
  onDelete,
  onTogglePin,
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(
    post.likeCount,
  );

  const likeMutation = useMutation({
    mutationFn: () => postsApi.toggleLike(orgId, post.id),
    onError: () => {
      setIsLiked((current) => !current);
      setOptimisticLikeCount((current) => current + (isLiked ? 1 : -1));
    },
  });

  const organizationName = post.organizationName || "Komunitas Kampus";

  const sortedMedia = useMemo(() => {
    return [...post.media].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [post.media]);

  const handleLike = () => {
    setIsLiked((current) => !current);
    setOptimisticLikeCount((current) => current + (isLiked ? -1 : 1));
    likeMutation.mutate();
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-neutral-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-start gap-3 p-5">
        <Avatar className="mt-1 h-12 w-12 border bg-white">
          <AvatarImage src={post.organizationAvatarUrl ?? undefined} />
          <AvatarFallback>{getInitials(organizationName)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-bold tracking-tight text-neutral-950">
              {organizationName}
            </h2>
            {post.isPinned && (
              <Badge
                variant="secondary"
                className="gap-1 rounded-full bg-indigo-50 text-indigo-700"
              >
                <Pin className="h-3 w-3" />
                Pinned
              </Badge>
            )}
            {isOwnerAdmin && (
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ${visibilityBadgeClassName(
                  post.visibility,
                )}`}
              >
                {visibilityLabel(post.visibility)}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <span>{formatPostTime(post.createdAt)}</span>
            <span>•</span>
            <Eye className="h-3.5 w-3.5" />
          </div>
        </div>

        {isOwnerAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit?.(post)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Caption
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePin?.(post)}>
                {post.isPinned ? (
                  <PinOff className="mr-2 h-4 w-4" />
                ) : (
                  <Pin className="mr-2 h-4 w-4" />
                )}
                {post.isPinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(post)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-5 pb-5">
          <p className="font-semibold leading-relaxed text-neutral-950">
            {post.title}
          </p>
          {post.caption && (
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
              {post.caption}
            </p>
          )}
        </div>

        <MediaArea media={sortedMedia} />
      </CardContent>

      <CardFooter className="block p-0">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-2 text-sm font-semibold transition ${
                isLiked
                  ? "text-rose-600"
                  : "text-neutral-800 hover:text-rose-600"
              }`}
            >
              <Heart className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`} />
              {formatNumber(optimisticLikeCount)}
            </button>

            <button className="flex items-center gap-2 text-sm font-semibold text-neutral-800 hover:text-indigo-700">
              <MessageCircle className="h-6 w-6" />
              {formatNumber(post.commentCount)}
            </button>

            <button className="flex items-center gap-2 text-sm font-semibold text-neutral-800 hover:text-indigo-700">
              <Send className="h-6 w-6" />
              {formatNumber(post.shareCount)}
            </button>
          </div>

          <Bookmark className="h-6 w-6 text-neutral-800" />
        </div>

        {isOwnerAdmin && (
          <div className="border-t bg-neutral-50 px-5 py-3 text-xs font-semibold text-neutral-500">
            {formatNumber(optimisticLikeCount)} Likes ·{" "}
            {formatNumber(post.commentCount)} Comments ·{" "}
            {formatNumber(post.shareCount)} Shares
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
