import { router } from "../trpc";
import { userRouter } from "./user";
import { officeRouter } from "./office";
import { dashboardRouter } from "./dashboard";

export const appRouter = router({
  user: userRouter,
  office: officeRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
