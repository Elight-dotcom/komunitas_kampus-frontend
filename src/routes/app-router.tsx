import {
  LandingPage,
  LoginPage,
  RegisterOrganizationPage,
  RegisterUserPage,
} from "@/pages/auth";
import { FeedPage } from "@/pages/feed";
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
]);
