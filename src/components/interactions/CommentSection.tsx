import { useEffect, useMemo, useRef, useState } from "react";
import type { InfiniteData } from "@tanstack/react-query";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as signalR from "@microsoft/signalr";
import {
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Send,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { interactionsApi } from "@/api/interactions/interactions.api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/auth/auth.store";
import type {
  CommentAddedEventPayload,
  CommentDto,
  CommentModeratedEventPayload,
  ModerateCommentResult,
} from "@/types/interaction.types";
import { ModerateCommentModal } from "./ModerateCommentModal";

const COMMENT_PAGE_SIZE = 20;

interface CommentSectionProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwnerAdmin: boolean;
  initialCommentCount?: number;
  onCommentCountChange?: (commentCount: number) => void;
}

interface CommentBubbleProps {
  comment: CommentDto;
  currentUserId?: string | null;
  isOwnerAdmin: boolean;
  onDeleteOwnComment: (comment: CommentDto) => void;
  onModerateComment: (comment: CommentDto) => void;
  isActionLoading?: boolean;
}

function getInitials(name?: string | null) {
  return (name || "KK")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function normalizeRole(role?: string | null) {
  return (role ?? "").toLowerCase();
}

function formatRelativeTime(value: string) {
  const createdAt = new Date(value);
  const diffMs = Date.now() - createdAt.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(createdAt);
}

function getHubUrl() {
  return (
    (import.meta.env.VITE_SIGNALR_APP_HUB_URL as string | undefined) ??
    (import.meta.env.VITE_SIGNALR_URL as string | undefined) ??
    "/hubs/app"
  );
}

function extractErrorMessage(error: unknown) {
  const maybeAxiosError = error as {
    response?: {
      status?: number;
      data?: {
        message?: string;
      };
      headers?: Record<string, string>;
    };
    message?: string;
  };

  return {
    status: maybeAxiosError.response?.status,
    message:
      maybeAxiosError.response?.data?.message ??
      maybeAxiosError.message ??
      "Terjadi kesalahan.",
    retryAfter:
      maybeAxiosError.response?.headers?.["retry-after"] ??
      maybeAxiosError.response?.headers?.["Retry-After"],
  };
}

function updateCommentInInfiniteData(
  oldData: InfiniteData<CommentDto[]> | undefined,
  updater: (comment: CommentDto) => CommentDto,
) {
  if (!oldData) return oldData;

  return {
    ...oldData,
    pages: oldData.pages.map((page) => page.map(updater)),
  };
}

function appendCommentToInfiniteData(
  oldData: InfiniteData<CommentDto[]> | undefined,
  comment: CommentDto,
) {
  if (!oldData) {
    return {
      pageParams: [1],
      pages: [[comment]],
    };
  }

  const alreadyExists = oldData.pages.some((page) =>
    page.some((item) => item.id === comment.id),
  );

  if (alreadyExists) return oldData;

  const nextPages = oldData.pages.map((page, index) => {
    if (index !== oldData.pages.length - 1) return page;
    return [...page, comment];
  });

  return {
    ...oldData,
    pages: nextPages,
  };
}

function CommentBubble({
  comment,
  currentUserId,
  isOwnerAdmin,
  onDeleteOwnComment,
  onModerateComment,
  isActionLoading,
}: CommentBubbleProps) {
  const isOwnComment = currentUserId === comment.userId;
  const isAdminComment = ["organization", "organisasi"].includes(
    normalizeRole(comment.role),
  );

  const canOpenMenu = !comment.isDeleted && (isOwnComment || isOwnerAdmin);

  return (
    <div className="flex gap-3 py-4">
      <Avatar className="mt-1 h-9 w-9">
        <AvatarImage src={comment.avatarUrl ?? undefined} />
        <AvatarFallback>{getInitials(comment.username)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-neutral-950">
                {comment.username ?? "Pengguna"}
              </span>
              {isAdminComment && (
                <Badge className="rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
                  Admin
                </Badge>
              )}
              <span className="text-xs text-neutral-400">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>
          </div>

          {canOpenMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isActionLoading}
                  className="h-8 w-8 rounded-full"
                >
                  {isActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isOwnComment && (
                  <DropdownMenuItem
                    onClick={() => onDeleteOwnComment(comment)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                  </DropdownMenuItem>
                )}

                {isOwnerAdmin && (
                  <DropdownMenuItem
                    onClick={() => onModerateComment(comment)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Hapus (Moderasi)
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {comment.isDeleted ? (
          <div className="mt-2 rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm italic text-amber-800">
            <div className="flex gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Komentar ini telah dihapus oleh Admin karena:{" "}
                {comment.deletedReason ?? "Tidak ada alasan tertulis."}
              </span>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
            {comment.content}
          </p>
        )}
      </div>
    </div>
  );
}

export function CommentSection({
  postId,
  open,
  onOpenChange,
  isOwnerAdmin,
  initialCommentCount = 0,
  onCommentCountChange,
}: CommentSectionProps) {
  const queryClient = useQueryClient();
  const auth = useAuthStore((state) => state) as any;
  const currentUserId =
    auth.userId ?? auth.accountId ?? auth.user?.accountId ?? auth.user?.id;
  const accessToken =
    auth.token ?? auth.accessToken ?? auth.user?.accessToken ?? auth.session?.accessToken;

  const [content, setContent] = useState("");
  const [localCommentCount, setLocalCommentCount] =
    useState(initialCommentCount);
  const [selectedModerationComment, setSelectedModerationComment] =
    useState<CommentDto | null>(null);

  const observerTargetRef = useRef<HTMLDivElement | null>(null);

  const queryKey = useMemo(
    () => ["interactions", "comments", postId] as const,
    [postId],
  );

  const commentsQuery = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      interactionsApi.getComments(postId, Number(pageParam), COMMENT_PAGE_SIZE),
    enabled: Boolean(postId && open),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < COMMENT_PAGE_SIZE) return undefined;
      return allPages.length + 1;
    },
  });

  const comments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page) ?? [],
    [commentsQuery.data],
  );

  useEffect(() => {
    setLocalCommentCount(initialCommentCount);
  }, [initialCommentCount]);

  useEffect(() => {
    if (!open || !observerTargetRef.current) return;

    const element = observerTargetRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (
          entry.isIntersecting &&
          commentsQuery.hasNextPage &&
          !commentsQuery.isFetchingNextPage
        ) {
          commentsQuery.fetchNextPage();
        }
      },
      {
        rootMargin: "160px",
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [
    open,
    commentsQuery.hasNextPage,
    commentsQuery.isFetchingNextPage,
    commentsQuery.fetchNextPage,
  ]);

  useEffect(() => {
    if (!open || !postId) return;

    const hubUrl = getHubUrl();
    const connectionBuilder = new signalR.HubConnectionBuilder()
      .withAutomaticReconnect();

    const connection = accessToken
      ? connectionBuilder
          .withUrl(hubUrl, {
            accessTokenFactory: () => accessToken,
          })
          .build()
      : connectionBuilder.withUrl(hubUrl).build();

    const handleCommentAdded = (payload: CommentAddedEventPayload) => {
      if (String(payload.postId).toLowerCase() !== postId.toLowerCase()) return;

      queryClient.setQueryData<InfiniteData<CommentDto[]>>(
        queryKey,
        (oldData) => appendCommentToInfiniteData(oldData, payload.comment),
      );

      if (typeof payload.commentCount === "number") {
        setLocalCommentCount(payload.commentCount);
        onCommentCountChange?.(payload.commentCount);
      } else {
        setLocalCommentCount((current) => {
          const next = current + 1;
          onCommentCountChange?.(next);
          return next;
        });
      }
    };

    const handleCommentModerated = (payload: CommentModeratedEventPayload) => {
      if (String(payload.postId).toLowerCase() !== postId.toLowerCase()) return;

      queryClient.setQueryData<InfiniteData<CommentDto[]>>(
        queryKey,
        (oldData) =>
          updateCommentInInfiniteData(oldData, (comment) =>
            comment.id === payload.commentId
              ? {
                  ...comment,
                  content: null,
                  isDeleted: true,
                  deletedReason:
                    payload.deletedReason ?? "Komentar dimoderasi oleh admin.",
                }
              : comment,
          ),
      );

      if (typeof payload.commentCount === "number") {
        setLocalCommentCount(payload.commentCount);
        onCommentCountChange?.(payload.commentCount);
      }
    };

    connection.on("CommentAdded", handleCommentAdded);
    connection.on("CommentModerated", handleCommentModerated);

    connection
      .start()
      .then(() => connection.invoke("JoinPostGroup", postId))
      .catch(() => {
        // SignalR gagal tidak boleh memblokir fitur komentar.
      });

    return () => {
      connection.off("CommentAdded", handleCommentAdded);
      connection.off("CommentModerated", handleCommentModerated);

      connection
        .invoke("LeavePostGroup", postId)
        .catch(() => undefined)
        .finally(() => {
          connection.stop().catch(() => undefined);
        });
    };
  }, [
    open,
    postId,
    accessToken,
    queryClient,
    queryKey,
    onCommentCountChange,
  ]);

  const createCommentMutation = useMutation({
    mutationFn: () => interactionsApi.createComment(postId, content.trim()),
    onSuccess: (newComment) => {
      setContent("");

      queryClient.setQueryData<InfiniteData<CommentDto[]>>(
        queryKey,
        (oldData) => appendCommentToInfiniteData(oldData, newComment),
      );

      setLocalCommentCount((current) => {
        const next = current + 1;
        onCommentCountChange?.(next);
        return next;
      });

      toast.success("Komentar berhasil dikirim.");
    },
    onError: (error: unknown) => {
      const { status, message, retryAfter } = extractErrorMessage(error);

      if (status === 429) {
        toast.error(
          `Terlalu banyak komentar, tunggu ${retryAfter ?? 60} detik.`,
        );
        return;
      }

      toast.error(message || "Gagal mengirim komentar.");
    },
  });

  const deleteOwnCommentMutation = useMutation({
    mutationFn: (comment: CommentDto) =>
      interactionsApi.deleteOwnComment(postId, comment.id),
    onSuccess: (_result, deletedComment) => {
      queryClient.setQueryData<InfiniteData<CommentDto[]>>(
        queryKey,
        (oldData) =>
          updateCommentInInfiniteData(oldData, (comment) =>
            comment.id === deletedComment.id
              ? {
                  ...comment,
                  content: null,
                  isDeleted: true,
                  deletedReason: "Dihapus oleh pemilik komentar.",
                }
              : comment,
          ),
      );

      setLocalCommentCount((current) => {
        const next = Math.max(0, current - 1);
        onCommentCountChange?.(next);
        return next;
      });

      toast.success("Komentar berhasil dihapus.");
    },
    onError: () => {
      toast.error("Gagal menghapus komentar.");
    },
  });

  const handleModerationSuccess = (result: ModerateCommentResult) => {
    queryClient.setQueryData<InfiniteData<CommentDto[]>>(
      queryKey,
      (oldData) =>
        updateCommentInInfiniteData(oldData, (comment) =>
          comment.id === result.commentId
            ? {
                ...comment,
                content: null,
                isDeleted: true,
                deletedReason: result.deletedReason,
              }
            : comment,
        ),
    );

    setLocalCommentCount(result.commentCount);
    onCommentCountChange?.(result.commentCount);
  };

  const canSend = content.trim().length > 0 && content.length <= 500;
  const activeDeleteId = deleteOwnCommentMutation.variables?.id;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Komentar
              <span className="text-sm font-medium text-neutral-500">
                ({localCommentCount})
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5">
            {commentsQuery.isLoading && (
              <div className="space-y-4 py-5">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            )}

            {!commentsQuery.isLoading && comments.length === 0 && (
              <div className="flex min-h-60 flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                  <MessageCircle className="h-7 w-7 text-indigo-700" />
                </div>
                <p className="font-semibold text-neutral-950">
                  Belum ada komentar
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  Jadilah yang pertama memulai diskusi.
                </p>
              </div>
            )}

            {comments.map((comment) => (
              <CommentBubble
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                isOwnerAdmin={isOwnerAdmin}
                isActionLoading={activeDeleteId === comment.id}
                onDeleteOwnComment={(targetComment) =>
                  deleteOwnCommentMutation.mutate(targetComment)
                }
                onModerateComment={setSelectedModerationComment}
              />
            ))}

            <div ref={observerTargetRef} className="h-8">
              {commentsQuery.isFetchingNextPage && (
                <div className="flex justify-center py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 border-t bg-white p-4">
            <div className="flex items-end gap-3">
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={500}
                placeholder="Tulis komentar..."
                className="max-h-40 min-h-12 resize-none"
                disabled={createCommentMutation.isPending}
              />
              <Button
                type="button"
                size="icon"
                disabled={!canSend || createCommentMutation.isPending}
                onClick={() => createCommentMutation.mutate()}
                className="h-12 w-12 flex-shrink-0 rounded-full bg-indigo-800 hover:bg-indigo-900"
              >
                {createCommentMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <div
              className={`mt-2 text-right text-xs ${
                content.length > 500 ? "text-red-600" : "text-neutral-500"
              }`}
            >
              {content.length}/500
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ModerateCommentModal
        postId={postId}
        comment={selectedModerationComment}
        open={Boolean(selectedModerationComment)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSelectedModerationComment(null);
        }}
        onSuccess={handleModerationSuccess}
      />
    </>
  );
}
