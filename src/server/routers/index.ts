import { router } from "../trpc";
import { userRouter } from "./user";
import { officeRouter } from "./office";
import { dashboardRouter } from "./dashboard";
import { whatsappRouter } from "./whatsapp";
import { aiConfigRouter } from "./ai-config";
import { conversationRouter } from "./conversation";
import { leadRouter } from "./lead";
import { processRouter } from "./process";

export const appRouter = router({
  user: userRouter,
  office: officeRouter,
  dashboard: dashboardRouter,
  whatsapp: whatsappRouter,
  aiConfig: aiConfigRouter,
  conversation: conversationRouter,
  lead: leadRouter,
  process: processRouter,
});

export type AppRouter = typeof appRouter;
