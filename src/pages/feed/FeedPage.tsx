import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { LogOut, Plus, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { httpClient } from "@/api/common/http-client";
import { postsApi } from "@/api/posts/posts.api";
import {
  CreatePostModal,
  EditPostModal,
  FeedSidebar,
  PostCard,
  PostCardSkeleton,
  StoryRail,
} from "@/components/posts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth/auth-store";
import type { Post } from "@/types/posts/post.types";

const PAGE_SIZE = 10;

type AuthStoreShape = {
  token?: string | null;
  accessToken?: string | null;
  role?: string | null;
  organizationId?: string | null;
  user?: {
    accountId?: string | null;
    username?: string | null;
    email?: string | null;
    role?: string | null;
    organizationId?: string | null;
    organization_id?: string | null;
  } | null;
  resetAuth?: () => void;
  clearAuth?: () => void;
  logout?: () => void;
  setAccessToken?: (token: string | null) => void;
};

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

function getNextPinOrder(posts: Post[]) {
  const usedOrders = posts
    .filter((post) => post.isPinned)
    .map((post) => post.pinOrder)
    .filter((value): value is number => typeof value === "number");

  for (const order of [1, 2, 3]) {
    if (!usedOrders.includes(order)) {
      return order;
    }
  }

  return 3;
}

function isOrganizationRole(role?: string | null) {
  return (
    role?.toLowerCase() === "organization" ||
    role?.toLowerCase() === "organisasi"
  );
}

export default function FeedPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const auth = useAuthStore() as unknown as AuthStoreShape;
  const role = auth.role ?? auth.user?.role ?? null;
  const currentOrganizationId =
    auth.organizationId ??
    auth.user?.organizationId ??
    auth.user?.organization_id ??
    null;

  const isAdmin =
    isOrganizationRole(role) &&
    Boolean(orgId) &&
    currentOrganizationId === orgId;

  const feedQuery = useInfiniteQuery({
    queryKey: ["posts", "feed", orgId],
    enabled: Boolean(orgId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => postsApi.getFeed(orgId!, pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return pages.length + 1;
    },
  });

  const posts = useMemo(() => {
    return sortPinnedFirst(feedQuery.data?.pages.flat() ?? []);
  }, [feedQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => postsApi.deletePost(orgId!, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", "feed", orgId] });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: (post: Post) => {
      const nextPinnedState = !post.isPinned;
      const nextPinOrder = nextPinnedState ? getNextPinOrder(posts) : null;

      return postsApi.togglePin(orgId!, post.id, {
        isPinned: nextPinnedState,
        pinOrder: nextPinOrder,
      });
    },
    onMutate: async (post) => {
      await queryClient.cancelQueries({ queryKey: ["posts", "feed", orgId] });
      const previousFeed = queryClient.getQueryData(["posts", "feed", orgId]);

      queryClient.setQueryData(["posts", "feed", orgId], (oldData: unknown) => {
        if (!oldData || typeof oldData !== "object" || !("pages" in oldData)) {
          return oldData;
        }

        const data = oldData as { pages: Post[][]; pageParams: unknown[] };
        const nextPinnedState = !post.isPinned;
        const nextPinOrder = nextPinnedState ? getNextPinOrder(posts) : null;

        return {
          ...data,
          pages: data.pages.map((page) =>
            page.map((item) =>
              item.id === post.id
                ? { ...item, isPinned: nextPinnedState, pinOrder: nextPinOrder }
                : item,
            ),
          ),
        };
      });

      return { previousFeed };
    },
    onError: (_error, _post, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(
          ["posts", "feed", orgId],
          context.previousFeed,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", "feed", orgId] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await httpClient.post("/api/auth/logout");
    },
    onSettled: () => {
      auth.logout?.();
      auth.resetAuth?.();
      auth.clearAuth?.();
      auth.setAccessToken?.(null);

      localStorage.removeItem("auth-storage");
      localStorage.removeItem("auth");

      navigate("/login", { replace: true });
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
    if (!orgId) return;
    setIsCreatePostOpen(true);
  };

  if (!orgId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-bold text-neutral-950">
            Organization ID tidak ditemukan.
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Pastikan route memakai format /organizations/:orgId/posts.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[#f7f7fb] xl:pl-72">
        <FeedSidebar
          isAdmin={isAdmin}
          userName={auth.user?.username ?? auth.user?.email ?? "User"}
          userRole={role ?? "viewer"}
          onCreatePost={goToCreatePost}
          onLogout={() => logoutMutation.mutate()}
        />

        <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur xl:pl-0">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            <div className="hidden flex-1 items-center md:flex">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Search campus, organizations..."
                  className="h-12 rounded-full border-neutral-300 bg-white pl-12 shadow-none"
                />
              </div>
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

            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-full"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        <section className="mx-auto max-w-5xl px-4 py-5">
          <StoryRail isAdmin={isAdmin} onCreatePost={goToCreatePost} />

          <div className="mx-auto mt-6 max-w-3xl space-y-6">
            {feedQuery.isLoading && (
              <>
                <PostCardSkeleton />
                <PostCardSkeleton />
              </>
            )}

            {!feedQuery.isLoading && posts.length === 0 && (
              <div className="rounded-3xl border bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                  <Sparkles className="h-8 w-8 text-indigo-700" />
                </div>
                <h2 className="text-xl font-bold text-neutral-950">
                  Belum ada postingan
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
                  Feed resmi organisasi akan tampil di sini setelah admin
                  membuat postingan.
                </p>
                {isAdmin && (
                  <Button
                    className="mt-6 rounded-full bg-indigo-800 hover:bg-indigo-900"
                    onClick={goToCreatePost}
                  >
                    Buat Postingan
                  </Button>
                )}
              </div>
            )}

            {posts.map((post) => (
              <PostCard
                key={post.id}
                orgId={orgId}
                post={post}
                isOwnerAdmin={isAdmin && post.organizationId === orgId}
                onEdit={(selectedPost) => setEditingPost(selectedPost)}
                onDelete={(selectedPost) => {
                  const confirmed = window.confirm(
                    "Yakin ingin menghapus postingan ini? File media juga akan dihapus dari MinIO.",
                  );

                  if (confirmed) {
                    deleteMutation.mutate(selectedPost.id);
                  }
                }}
                onTogglePin={(selectedPost) =>
                  togglePinMutation.mutate(selectedPost)
                }
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

        {isAdmin && (
          <Button
            size="icon"
            className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-2xl bg-indigo-800 shadow-xl hover:bg-indigo-900 xl:hidden"
            onClick={goToCreatePost}
          >
            <Plus className="h-7 w-7" />
          </Button>
        )}
      </main>

      {orgId && (
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
        </>
      )}
    </>
  );
}
