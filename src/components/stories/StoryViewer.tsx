import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { storiesApi } from "@/api/stories/stories.api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Story, StoryGroup } from "@/types/stories/story.types";
import { normalizeStoryMediaType } from "@/types/stories/story.types";

interface StoryViewerProps {
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_STORY_DURATION_MS = 5_000;
const HOLD_THRESHOLD_MS = 250;

function getInitials(name?: string | null) {
  return (name || "KK")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "baru saja";

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  return `${Math.floor(diffHours / 24)} hari lalu`;
}

function resolveFileUrl(fileUrl?: string | null) {
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

function getStoryDuration(story: Story, videoDurationMs: number | null) {
  if (normalizeStoryMediaType(story.mediaType) === "video" && videoDurationMs) {
    return Math.max(1_000, videoDurationMs);
  }

  return DEFAULT_STORY_DURATION_MS;
}

export function StoryViewer({
  storyGroups,
  initialGroupIndex,
  open,
  onOpenChange,
}: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [videoDurationMs, setVideoDurationMs] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const progressStartedAtRef = useRef(Date.now());
  const pausedAtProgressRef = useRef(0);
  const viewedStoryIdsRef = useRef<Set<string>>(new Set());
  const pointerDownAtRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);

  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  const currentDuration = useMemo(() => {
    if (!currentStory) return DEFAULT_STORY_DURATION_MS;
    return getStoryDuration(currentStory, videoDurationMs);
  }, [currentStory, videoDurationMs]);

  const goToNext = () => {
    if (!currentGroup) return;

    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex((current) => current + 1);
      return;
    }

    if (groupIndex < storyGroups.length - 1) {
      setGroupIndex((current) => current + 1);
      setStoryIndex(0);
      return;
    }

    onOpenChange(false);
  };

  const goToPrevious = () => {
    if (storyIndex > 0) {
      setStoryIndex((current) => current - 1);
      return;
    }

    if (groupIndex > 0) {
      const previousGroupIndex = groupIndex - 1;
      const previousGroup = storyGroups[previousGroupIndex];

      setGroupIndex(previousGroupIndex);
      setStoryIndex(Math.max(0, previousGroup.stories.length - 1));
    }
  };

  useEffect(() => {
    if (!open) return;

    setGroupIndex(initialGroupIndex);
    setStoryIndex(0);
    setProgress(0);
    setIsPaused(false);
    setVideoDurationMs(null);
  }, [open, initialGroupIndex]);

  useEffect(() => {
    setProgress(0);
    setVideoDurationMs(null);
    progressStartedAtRef.current = Date.now();
    pausedAtProgressRef.current = 0;
  }, [groupIndex, storyIndex]);

  useEffect(() => {
    if (!open || !currentStory) return;

    if (viewedStoryIdsRef.current.has(currentStory.id)) return;
    viewedStoryIdsRef.current.add(currentStory.id);

    void storiesApi.markStoryViewed(currentStory.id).catch(() => {
      // Fire-and-forget: tracking view tidak boleh mengganggu UX viewer.
    });
  }, [open, currentStory]);

  useEffect(() => {
    if (!open || !currentStory) return;

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    if (isPaused) {
      pausedAtProgressRef.current = progress;
      return;
    }

    progressStartedAtRef.current =
      Date.now() - (pausedAtProgressRef.current / 100) * currentDuration;

    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - progressStartedAtRef.current;
      const nextProgress = Math.min(100, (elapsed / currentDuration) * 100);

      setProgress(nextProgress);

      if (nextProgress >= 100) {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
        }

        goToNext();
      }
    }, 80);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
    // goToNext sengaja tidak dimasukkan agar interval tidak reset setiap render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentStory?.id, currentDuration, isPaused]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  if (!currentGroup || !currentStory) {
    return null;
  }

  const mediaType = normalizeStoryMediaType(currentStory.mediaType);

  const handleContentClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - bounds.left;
    const ratio = clickX / bounds.width;

    if (ratio > 0.6) {
      goToNext();
      return;
    }

    if (ratio < 0.4) {
      goToPrevious();
    }
  };

  const handlePointerDown = () => {
    pointerDownAtRef.current = Date.now();
    isHoldingRef.current = false;
    setIsPaused(true);
  };

  const handlePointerUp = () => {
    const startedAt = pointerDownAtRef.current;
    const holdDuration = startedAt ? Date.now() - startedAt : 0;

    isHoldingRef.current = holdDuration >= HOLD_THRESHOLD_MS;
    pointerDownAtRef.current = null;
    setIsPaused(false);
  };

  const backgroundColor =
    currentStory.backgroundColor || "linear-gradient(135deg, #4f46e5, #ec4899)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[100dvh] max-h-[100dvh] w-screen max-w-none border-none bg-neutral-950 p-0 text-white sm:rounded-none">
        <DialogTitle className="sr-only">Story Viewer</DialogTitle>

        <div className="relative flex h-full w-full flex-col overflow-hidden">
          <div className="absolute left-0 right-0 top-0 z-30 space-y-4 p-4">
            <div className="flex gap-1">
              {currentGroup.stories.map((story, index) => (
                <div
                  key={story.id}
                  className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
                >
                  <div
                    className="h-full bg-white transition-[width] duration-75"
                    style={{
                      width:
                        index < storyIndex
                          ? "100%"
                          : index === storyIndex
                            ? `${progress}%`
                            : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-10 w-10 border border-white/30">
                  <AvatarImage src={currentGroup.orgAvatar ?? undefined} />
                  <AvatarFallback className="bg-white text-neutral-950">
                    {getInitials(currentGroup.orgName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {currentGroup.orgName}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-white/70">
                      {formatRelativeTime(currentStory.createdAt)}
                    </p>
                    {currentStory.viewCount > 0 && (
                      <span className="text-xs text-white/50">
                        • {currentStory.viewCount} penonton
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
                aria-label="Tutup story"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            className="flex min-h-0 flex-1 select-none items-center justify-center"
            onClick={handleContentClick}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
              pointerDownAtRef.current = null;
              setIsPaused(false);
            }}
            onPointerLeave={() => {
              pointerDownAtRef.current = null;
              setIsPaused(false);
            }}
          >
            {mediaType === "image" && (
              <img
                src={resolveFileUrl(currentStory.mediaUrl)}
                alt={currentStory.orgName}
                className="h-full w-full object-contain sm:object-cover"
                draggable={false}
              />
            )}

            {mediaType === "video" && (
              <video
                key={currentStory.id}
                src={resolveFileUrl(currentStory.mediaUrl)}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-contain"
                onLoadedMetadata={(event) => {
                  const duration = event.currentTarget.duration;

                  if (Number.isFinite(duration) && duration > 0) {
                    setVideoDurationMs(duration * 1000);
                  }
                }}
                onEnded={goToNext}
              />
            )}

            {mediaType === "text" && (
              <div
                className="flex h-full w-full items-center justify-center px-8 text-center"
                style={{ background: backgroundColor }}
              >
                <p className="max-w-3xl whitespace-pre-line text-3xl font-extrabold leading-tight sm:text-5xl">
                  {currentStory.textContent}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
