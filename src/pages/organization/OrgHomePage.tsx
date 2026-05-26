import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { storiesApi } from "@/api/stories/stories.api";
import { StoryBar, CreateStoryModal } from "@/components/stories";
import { postsApi } from "@/api/posts/posts.api";
import {
  CreatePostModal,
  EditPostModal,
  PostCard,
  PostCardSkeleton,
} from "@/components/posts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth/auth.store";
import type { Post } from "@/types/posts/post.types";
import { userFeedApi } from "@/api/feed/user-feed.api";
import { OrgSidebar } from "@/components/layouts/OrgSidebar";

const PAGE_SIZE = 10;

function sortPinnedFirst(posts: Post[]) {
  return [...posts].sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return left.isPinned ? -1 : 1;
    }

    if (left.isPinned && right.isPinned) {
      return (left.pinOrder ?? 999) - (right.pinOrder ?? 999);
    }

    return (
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  });
}

export default function OrgHomePage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const auth = useAuthStore();
  const role = auth.role ?? auth.user?.role ?? null;
  const currentOrgId = auth.user?.organizationId ?? null;

  console.log("OrgHomePage auth:", { role, currentOrgId, orgId });

  const isAdmin =
    role?.toLowerCase() === "organisasi" &&
    Boolean(orgId) &&
    currentOrgId === orgId;

  console.log("isAdmin:", isAdmin, "role check:", role?.toLowerCase() === "organisasi");

  const feedQuery = useInfiniteQuery({
    queryKey: ["posts", "global"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => userFeedApi.getGlobalFeed(pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return pages.length + 1;
    },
  });

  const activeStoriesQuery = useQuery({
    queryKey: ["stories", "active"],
    queryFn: storiesApi.getActiveStories,
    refetchInterval: 60_000,
    staleTime: 30_000,
    enabled: !isAdmin,
  });

  const myStoriesQuery = useQuery({
    queryKey: ["stories", "my-org", orgId],
    queryFn: () => storiesApi.getMyOrganizationStories(orgId!),
    refetchInterval: 60_000,
    staleTime: 30_000,
    enabled: isAdmin && Boolean(orgId),
  });

  const displayStories = isAdmin
    ? myStoriesQuery.data ?? []
    : activeStoriesQuery.data ?? [];

  const displayStoryGroups = isAdmin && myStoriesQuery.data
    ? [{
        organizationId: orgId!,
        orgName: auth.user?.username ?? "Organisasi",
        orgAvatar: null,
        hasUnviewed: false,
        stories: myStoriesQuery.data,
      }]
    : activeStoriesQuery.data ?? [];

  const posts = useMemo(() => {
    return sortPinnedFirst(feedQuery.data?.pages.flat() ?? []);
  }, [feedQuery.data]);

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => postsApi.deletePost(orgId!, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", "global"] });
    },
  });

  const getNextPinOrder = (currentPosts: Post[]) => {
    const usedOrders = currentPosts
      .filter((post) => post.isPinned)
      .map((post) => post.pinOrder)
      .filter((value): value is number => typeof value === "number");

    for (const order of [1, 2, 3]) {
      if (!usedOrders.includes(order)) {
        return order;
      }
    }
    return 3;
  };

  const togglePinMutation = useMutation({
    mutationFn: (post: Post) => {
      const nextPinnedState = !post.isPinned;
      const nextPinOrder = nextPinnedState ? getNextPinOrder(posts) : null;
      return postsApi.togglePin(orgId!, post.id, {
        isPinned: nextPinnedState,
        pinOrder: nextPinOrder,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", "global"] });
    },
  });

  useEffect(() => {
    const target = infiniteScrollRef.current;

    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (
          firstEntry.isIntersecting &&
          feedQuery.hasNextPage &&
          !feedQuery.isFetchingNextPage
        ) {
          feedQuery.fetchNextPage();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [feedQuery]);

  const goToCreatePost = () => {
    setIsCreatePostOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/organizations/${orgId}/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (!orgId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-bold text-neutral-950">
            Organization ID tidak ditemukan.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[#f7f7fb] xl:pl-72">
        <OrgSidebar
          orgId={orgId}
          isAdmin={isAdmin}
          userName={auth.user?.username ?? auth.user?.email ?? "Organization"}
          userRole={role ?? "organisasi"}
          onCreatePost={goToCreatePost}
        />

        <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur xl:pl-0">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            <div className="hidden flex-1 items-center md:flex">
              <form onSubmit={handleSearch} className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Search organizations..."
                  className="h-12 rounded-full border-neutral-300 bg-white pl-12 shadow-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>

            <div className="flex flex-1 items-center gap-3 md:hidden">
              <Avatar className="h-10 w-10">
                <AvatarFallback>KK</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-extrabold text-indigo-800">
                  KomunitasKampus
                </p>
                <p className="text-xs text-neutral-500">Academic Social Hub</p>
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-5xl px-4 py-5">
          <StoryBar
            storyGroups={displayStoryGroups}
            isLoading={isAdmin ? myStoriesQuery.isLoading : activeStoriesQuery.isLoading}
            onRefresh={() => isAdmin ? myStoriesQuery.refetch() : activeStoriesQuery.refetch()}
          />

          <div className="mx-auto mt-6 max-w-3xl space-y-6">
            {feedQuery.isLoading && (
              <>
                <PostCardSkeleton />
                <PostCardSkeleton />
              </>
            )}

            {!feedQuery.isLoading && posts.length === 0 && (
              <div className="rounded-3xl border bg-white px-6 py-14 text-center shadow-sm">
                <h2 className="text-xl font-bold text-neutral-950">
                  Belum ada postingan
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
                  Postingan dari organisasi akan tampil di sini.
                </p>
              </div>
            )}

            {posts.map((post) => (
              <PostCard
                key={post.id}
                orgId={post.organizationId}
                post={post}
                isOwnerAdmin={isAdmin && post.organizationId === orgId}
                onEdit={(selectedPost) => setEditingPost(selectedPost)}
                onDelete={(selectedPost) => {
                  if (window.confirm("Yakin ingin menghapus postingan ini?")) {
                    deleteMutation.mutate(selectedPost.id);
                  }
                }}
                onTogglePin={(selectedPost) => togglePinMutation.mutate(selectedPost)}
              />
            ))}

            <div ref={infiniteScrollRef} className="h-8" />

            {feedQuery.isFetchingNextPage && (
              <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <PostCardSkeleton />
              </div>
            )}

            {!feedQuery.hasNextPage && posts.length > 0 && (
              <p className="pb-24 text-center text-xs text-neutral-400">
                Kamu sudah sampai di akhir feed.
              </p>
            )}
          </div>
        </section>
      </main>

      {orgId && isAdmin && (
        <>
          <CreatePostModal
            orgId={orgId}
            open={isCreatePostOpen}
            onOpenChange={setIsCreatePostOpen}
          />

          <EditPostModal
            orgId={orgId}
            post={editingPost}
            open={Boolean(editingPost)}
            onOpenChange={(open) => {
              if (!open) setEditingPost(null);
            }}
          />

          <CreateStoryModal
            orgId={orgId}
            open={isCreateStoryOpen}
            onOpenChange={setIsCreateStoryOpen}
            onSuccess={() => activeStoriesQuery.refetch()}
          />
        </>
      )}

      {isAdmin && (
        <button
          type="button"
          onClick={() => setIsCreateStoryOpen(true)}
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-fuchsia-500 via-rose-500 to-amber-400 text-white shadow-lg transition hover:scale-105 hover:shadow-xl z-40"
          aria-label="Buat Story Baru"
        >
          <Plus className="h-7 w-7" />
        </button>
      )}
    </>
  );
}