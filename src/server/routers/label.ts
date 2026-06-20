import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const labelRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.label.findMany({
      where: { officeId: ctx.dbUser.officeId },
      orderBy: { name: "asc" },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().min(4).default("#6366f1"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.label.create({
        data: {
          officeId: ctx.dbUser.officeId,
          name: input.name,
          color: input.color,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        color: z.string().min(4).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await ctx.prisma.label.findFirst({
        where: { id, officeId: ctx.dbUser.officeId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.label.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.label.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.label.delete({ where: { id: input.id } });
    }),

  assignToLead: protectedProcedure
    .input(z.object({ leadId: z.string(), labelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.prisma.lead.findFirst({
        where: { id: input.leadId, officeId: ctx.dbUser.officeId },
      });
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.leadLabel.upsert({
        where: { leadId_labelId: { leadId: input.leadId, labelId: input.labelId } },
        create: { leadId: input.leadId, labelId: input.labelId },
        update: {},
      });
    }),

  removeFromLead: protectedProcedure
    .input(z.object({ leadId: z.string(), labelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.leadLabel.deleteMany({
        where: { leadId: input.leadId, labelId: input.labelId },
      });
    }),
});
