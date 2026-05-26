import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth/auth.store";
import type { StoryGroup } from "@/types/stories/story.types";
import { CreateStoryModal } from "./CreateStoryModal";
import { StoryViewer } from "./StoryViewer";

interface StoryBarProps {
  storyGroups: StoryGroup[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

function getInitials(name?: string | null) {
  return (name || "KK")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getAuthValue(auth: any, keys: string[]) {
  for (const key of keys) {
    if (auth?.[key]) return auth[key];
  }

  return undefined;
}

function StorySkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden px-4 py-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex w-20 shrink-0 flex-col items-center">
          <div className="h-16 w-16 animate-pulse rounded-full bg-neutral-200" />
          <div className="mt-2 h-3 w-14 animate-pulse rounded-full bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}

export function StoryBar({ storyGroups, isLoading, onRefresh }: StoryBarProps) {
  const auth = useAuthStore((state) => state) as any;
  const role = String(getAuthValue(auth, ["role"]) ?? auth.user?.role ?? "")
    .toLowerCase();
  const currentOrgId =
    getAuthValue(auth, ["orgId", "organizationId"]) ??
    auth.user?.orgId ??
    auth.user?.organizationId;

  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(
    null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const normalizedGroups = useMemo(() => {
    return storyGroups.filter((group) => group.stories.length > 0);
  }, [storyGroups]);

  const canCreateStory =
    (role === "organisasi" || role === "organization") && Boolean(currentOrgId);

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-white shadow-sm">
        <StorySkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex gap-4 overflow-x-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {canCreateStory && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="group flex w-20 shrink-0 flex-col items-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-indigo-300 bg-indigo-50 transition group-hover:bg-indigo-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-700 text-white">
                  <Plus className="h-5 w-5" />
                </div>
              </div>
              <span className="mt-2 max-w-20 truncate text-xs font-semibold text-neutral-700">
                Tambah
              </span>
            </button>
          )}

          {normalizedGroups.length === 0 && !canCreateStory && (
            <div className="flex min-h-20 flex-1 items-center justify-center text-center text-sm text-neutral-500">
              Belum ada story aktif.
            </div>
          )}

          {normalizedGroups.map((group, index) => (
            <button
              key={group.organizationId}
              type="button"
              onClick={() => setSelectedGroupIndex(index)}
              className="group flex w-20 shrink-0 flex-col items-center"
            >
              <div
                className={`rounded-full p-[3px] transition group-hover:scale-105 ${
                  group.hasUnviewed
                    ? "bg-gradient-to-tr from-fuchsia-500 via-rose-500 to-amber-400"
                    : "bg-neutral-300"
                }`}
              >
                <div className="rounded-full bg-white p-[3px]">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={group.orgAvatar ?? undefined} />
                    <AvatarFallback>{getInitials(group.orgName)}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="mt-2 max-w-20 truncate text-xs font-semibold text-neutral-700">
                {group.orgName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedGroupIndex !== null && (
        <StoryViewer
          storyGroups={normalizedGroups}
          initialGroupIndex={selectedGroupIndex}
          open={selectedGroupIndex !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setSelectedGroupIndex(null);
              onRefresh?.();
            }
          }}
        />
      )}

      {canCreateStory && (
        <CreateStoryModal
          orgId={currentOrgId}
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}
