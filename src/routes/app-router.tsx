import {
  LandingPage,
  LoginPage,
  RegisterOrganizationPage,
  RegisterUserPage,
} from "@/pages/auth";
import ChatDashboardPage from "@/pages/chat/ChatDashboardPage";
import { MemberListPage } from "@/pages/members";
import { NotificationsPage } from "@/pages/notifications";
import OrgHomePage from "@/pages/organization/OrgHomePage";
import ExplorePage from "@/pages/user/ExplorePage";
import OrganizationProfilePage from "@/pages/user/OrganizationProfilePage";
import UserHomePage from "@/pages/user/UserHomePage";
import { useAuthStore } from "@/stores/auth/auth.store";
import { createBrowserRouter, redirect } from "react-router-dom";

function authLoader() {
  const auth = useAuthStore.getState();
  if (!auth.isAuthenticated) {
    return redirect("/login");
  }
  return null;
}

function userLoader() {
  const auth = useAuthStore.getState();
  if (!auth.isAuthenticated) {
    return redirect("/login");
  }
  if (auth.role === "Organisasi") {
    const orgId = auth.user?.organizationId as string | undefined;
    if (orgId) {
      return redirect(`/organizations/${orgId}/home`);
    }
  }
  return null;
}

function orgLoader() {
  const auth = useAuthStore.getState();
  if (!auth.isAuthenticated) {
    return redirect("/login");
  }
  if (auth.role === "Mahasiswa") {
    return redirect("/user/home");
  }
  return null;
}

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register/user",
    element: <RegisterUserPage />,
  },
  {
    path: "/register/organization",
    element: <RegisterOrganizationPage />,
  },
  {
    path: "/user/home",
    element: <UserHomePage />,
    loader: userLoader,
  },
  {
    path: "/user/explore",
    element: <ExplorePage />,
    loader: userLoader,
  },
  {
    path: "/user/notifications",
    element: <NotificationsPage />,
    loader: authLoader,
  },
  {
    path: "/organizations/:orgId/notifications",
    element: <NotificationsPage />,
    loader: orgLoader,
  },
  {
    path: "/organizations/:orgId/profile",
    element: <OrganizationProfilePage />,
    loader: userLoader,
  },
  {
    path: "/organizations/:orgId/home",
    element: <OrgHomePage />,
    loader: orgLoader,
  },
  {
    path: "/organizations/:orgId/members",
    element: <MemberListPage />,
    loader: orgLoader,
  },
  {
    path: "/chat",
    element: <ChatDashboardPage />,
    loader: authLoader,
  },
]);
