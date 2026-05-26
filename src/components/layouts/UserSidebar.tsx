import { Bell, Compass, Home, LogOut, Mail, Settings, UserRound } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth/auth.store";
import { httpClient } from "@/api/common/http-client";
import { useMutation } from "@tanstack/react-query";

interface UserSidebarProps {
  userName?: string | null;
}

function navClassName({ isActive }: { isActive: boolean }) {
  return [
    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
    isActive
      ? "bg-indigo-700 text-white shadow-sm"
      : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950",
  ].join(" ");
}

export function UserSidebar({ userName }: UserSidebarProps) {
  const navigate = useNavigate();
  const auth = useAuthStore();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await httpClient.post("/api/auth/logout");
    },
    onSettled: () => {
      auth.clearAuth();
      localStorage.removeItem("auth-storage");
      localStorage.removeItem("auth");
      navigate("/login", { replace: true });
    },
  });

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-72 flex-col border-r bg-white">
      <div className="px-7 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-indigo-800">
          KomunitasKampus
        </h1>
        <p className="mt-1 text-sm font-medium text-neutral-500">
          Academic Social Hub
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-5">
        <NavLink to="/user/home" end className={navClassName}>
          <Home className="h-5 w-5" />
          Home
        </NavLink>
        <NavLink to="/user/explore" className={navClassName}>
          <Compass className="h-5 w-5" />
          Explore
        </NavLink>
        <NavLink to="/user/notifications" className={navClassName}>
          <Bell className="h-5 w-5" />
          Notifications
        </NavLink>
        <NavLink to="/user/messages" className={navClassName}>
          <Mail className="h-5 w-5" />
          Messaging
        </NavLink>
        <NavLink to="/user/profile" className={navClassName}>
          <UserRound className="h-5 w-5" />
          Profile
        </NavLink>
      </nav>

      <div className="space-y-1 border-t p-5">
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
          <Settings className="h-5 w-5" />
          Account Settings
        </button>
        <button
          type="button"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>

        <div className="flex items-center gap-3 pt-3">
          <Avatar>
            <AvatarFallback>
              {(userName ?? "KK").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">
              {userName ?? "User"}
            </p>
            <p className="text-xs capitalize text-neutral-500">Mahasiswa</p>
          </div>
        </div>
      </div>
    </aside>
  );
}