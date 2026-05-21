import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { QueryProvider } from "@/providers/query-provider";
import { appRouter } from "@/routes/app-router";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <RouterProvider router={appRouter} />
    </QueryProvider>
  </React.StrictMode>,
);
