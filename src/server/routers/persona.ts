import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const personaRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.persona.findMany({
      where: { officeId: ctx.dbUser.officeId, isActive: true },
      orderBy: { name: "asc" },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        role: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.persona.create({
        data: {
          officeId: ctx.dbUser.officeId,
          name: input.name,
          role: input.role,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        role: z.string().min(1).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.prisma.persona.findFirst({
        where: { id, officeId: ctx.dbUser.officeId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.persona.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.persona.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.persona.delete({ where: { id: input.id } });
    }),
});
