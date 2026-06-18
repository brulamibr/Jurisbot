import { router } from "../trpc";
import { userRouter } from "./user";
import { officeRouter } from "./office";
import { dashboardRouter } from "./dashboard";
import { whatsappRouter } from "./whatsapp";

export const appRouter = router({
  user: userRouter,
  office: officeRouter,
  dashboard: dashboardRouter,
  whatsapp: whatsappRouter,
});

export type AppRouter = typeof appRouter;
