import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { storiesApi } from "@/api/stories/stories.api";
import { StoryBar } from "@/components/stories";
import {
  PostCard,
  PostCardSkeleton,
} from "@/components/posts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth/auth.store";
import type { Post } from "@/types/posts/post.types";
import { userFeedApi } from "@/api/feed/user-feed.api";
import { UserSidebar } from "@/components/layouts/UserSidebar";

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

export default function UserHomePage() {
  const navigate = useNavigate();
  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const auth = useAuthStore();

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
  });

  const posts = useMemo(() => {
    return sortPinnedFirst(feedQuery.data?.pages.flat() ?? []);
  }, [feedQuery.data]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/user/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-[#f7f7fb] xl:pl-72">
        <UserSidebar userName={auth.user?.username ?? auth.user?.email ?? "User"} />

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
            storyGroups={activeStoriesQuery.data ?? []}
            isLoading={activeStoriesQuery.isLoading}
            onRefresh={() => activeStoriesQuery.refetch()}
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
                isOwnerAdmin={false}
                onEdit={() => {}}
                onDelete={() => {}}
                onTogglePin={() => {}}
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
    </>
  );
}