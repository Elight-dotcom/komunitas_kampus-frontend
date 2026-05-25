import {
  LandingPage,
  LoginPage,
  RegisterOrganizationPage,
  RegisterUserPage,
} from "@/pages/auth";
import { FeedPage } from "@/pages/feed";
import { InvitationInboxPage } from "@/pages/invitation";
import { MemberListPage, PendingRequestsPage } from "@/pages/members";
import { createBrowserRouter } from "react-router-dom";

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
    path: "/organizations/:orgId/posts",
    element: <FeedPage />,
  },

  {
    path: "/invitations",
    element: <InvitationInboxPage />,
  },
  {
    path: "/organizations/:orgId/members",
    element: <MemberListPage />,
  },
  {
    path: "/organizations/:orgId/requests",
    element: <PendingRequestsPage />,
  },
]);
