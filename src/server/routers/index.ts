import { router } from "../trpc";
import { userRouter } from "./user";
import { officeRouter } from "./office";
import { dashboardRouter } from "./dashboard";
import { whatsappRouter } from "./whatsapp";
import { aiConfigRouter } from "./ai-config";
import { conversationRouter } from "./conversation";
import { leadRouter } from "./lead";
import { processRouter } from "./process";
import { knowledgeRouter } from "./knowledge";
import { personaRouter } from "./persona";
import { scheduledMessageRouter } from "./scheduled-message";
import { quickMessageRouter } from "./quick-message";
import { labelRouter } from "./label";
import { broadcastRouter } from "./broadcast";
import { funnelRouter } from "./funnel";
import { contactRouter } from "./contact";
import { whatsappGroupRouter } from "./whatsapp-group";

export const appRouter = router({
  user: userRouter,
  office: officeRouter,
  dashboard: dashboardRouter,
  whatsapp: whatsappRouter,
  aiConfig: aiConfigRouter,
  conversation: conversationRouter,
  lead: leadRouter,
  process: processRouter,
  knowledge: knowledgeRouter,
  persona: personaRouter,
  scheduledMessage: scheduledMessageRouter,
  quickMessage: quickMessageRouter,
  label: labelRouter,
  broadcast: broadcastRouter,
  funnel: funnelRouter,
  contact: contactRouter,
  whatsappGroup: whatsappGroupRouter,
});

export type AppRouter = typeof appRouter;
