import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";

export const officeRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.office.findUnique({
      where: { id: ctx.dbUser.officeId },
    });
  }),

  update: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        logo: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.office.update({
        where: { id: ctx.dbUser.officeId },
        data: input,
      });
    }),
});
