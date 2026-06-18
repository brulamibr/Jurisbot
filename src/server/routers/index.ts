import { router } from "../trpc";
import { userRouter } from "./user";
import { officeRouter } from "./office";
import { dashboardRouter } from "./dashboard";
import { whatsappRouter } from "./whatsapp";
import { aiConfigRouter } from "./ai-config";
import { conversationRouter } from "./conversation";

export const appRouter = router({
  user: userRouter,
  office: officeRouter,
  dashboard: dashboardRouter,
  whatsapp: whatsappRouter,
  aiConfig: aiConfigRouter,
  conversation: conversationRouter,
});

export type AppRouter = typeof appRouter;
