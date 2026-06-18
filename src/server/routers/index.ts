import { router } from "../trpc";
import { userRouter } from "./user";
import { officeRouter } from "./office";

export const appRouter = router({
  user: userRouter,
  office: officeRouter,
});

export type AppRouter = typeof appRouter;
