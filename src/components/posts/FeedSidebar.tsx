import { Bell, Compass, HelpCircle, Home, LogOut, PlusSquare, Settings, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface FeedSidebarProps {
  isAdmin: boolean;
  userName?: string | null;
  userRole?: string | null;
  onCreatePost: () => void;
  onLogout: () => void;
}

function navClassName({ isActive }: { isActive: boolean }) {
  return [
    "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition",
    isActive
      ? "bg-indigo-700 text-white shadow-sm"
      : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950",
  ].join(" ");
}

export function FeedSidebar({
  isAdmin,
  userName,
  userRole,
  onCreatePost,
  onLogout,
}: FeedSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r bg-white xl:flex xl:flex-col">
      <div className="px-7 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-indigo-800">
          KomunitasKampus
        </h1>
        <p className="mt-1 text-sm font-medium text-neutral-500">Academic Social Hub</p>
      </div>

      <nav className="flex-1 space-y-2 px-5">
        <NavLink to="." className={navClassName} end>
          <Home className="h-5 w-5" />
          Home
        </NavLink>
        <NavLink to="#" className={navClassName}>
          <Compass className="h-5 w-5" />
          Explore
        </NavLink>
        {isAdmin && (
          <button
            type="button"
            onClick={onCreatePost}
            className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950"
          >
            <PlusSquare className="h-5 w-5" />
            Create
          </button>
        )}
        <NavLink to="#" className={navClassName}>
          <Bell className="h-5 w-5" />
          Notifications
        </NavLink>
        <NavLink to="#" className={navClassName}>
          <UserRound className="h-5 w-5" />
          Profile
        </NavLink>
      </nav>

      {isAdmin && (
        <div className="border-t p-5">
          <Button className="h-12 w-full rounded-full bg-indigo-800 text-base hover:bg-indigo-900" onClick={onCreatePost}>
            Create Post
          </Button>
        </div>
      )}

      <div className="space-y-3 border-t p-5">
        <button className="flex w-full items-center gap-4 rounded-xl px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
          <Settings className="h-5 w-5" />
          Settings
        </button>
        <button className="flex w-full items-center gap-4 rounded-xl px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
          <HelpCircle className="h-5 w-5" />
          Support
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>

        <div className="flex items-center gap-3 pt-2">
          <Avatar>
            <AvatarFallback>{(userName ?? "KK").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">
              {userName ?? "KomunitasKampus"}
            </p>
            <p className="text-xs capitalize text-neutral-500">{userRole ?? "viewer"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
