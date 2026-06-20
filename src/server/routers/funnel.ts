import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const DEFAULT_STAGES = [
  { name: "Frio", color: "#3b82f6", icon: "snowflake", order: 0 },
  { name: "Morno", color: "#f59e0b", icon: "thermometer", order: 1 },
  { name: "Quente", color: "#ef4444", icon: "flame", order: 2 },
  { name: "Convertido", color: "#22c55e", icon: "check-circle", order: 3 },
  { name: "Perdido", color: "#a1a1aa", icon: "x-circle", order: 4 },
];

export const funnelRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.funnel.findMany({
      where: { officeId: ctx.dbUser.officeId },
      include: {
        stages: { orderBy: { order: "asc" } },
        _count: { select: { stages: true } },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  }),

  getWithLeads: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const funnel = await ctx.prisma.funnel.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
        include: {
          stages: {
            orderBy: { order: "asc" },
            include: {
              leads: {
                include: {
                  contact: {
                    include: {
                      conversations: {
                        orderBy: { lastMessageAt: "desc" },
                        take: 1,
                        select: { id: true, lastMessageAt: true, status: true },
                      },
                    },
                  },
                  labels: { include: { label: true } },
                },
              },
            },
          },
        },
      });
      if (!funnel) throw new TRPCError({ code: "NOT_FOUND" });
      return funnel;
    }),

  getDefault: protectedProcedure.query(async ({ ctx }) => {
    let funnel = await ctx.prisma.funnel.findFirst({
      where: { officeId: ctx.dbUser.officeId, isDefault: true },
      include: { stages: { orderBy: { order: "asc" } } },
    });

    if (!funnel) {
      funnel = await ctx.prisma.funnel.create({
        data: {
          officeId: ctx.dbUser.officeId,
          name: "Padrão",
          isDefault: true,
          stages: {
            create: DEFAULT_STAGES,
          },
        },
        include: { stages: { orderBy: { order: "asc" } } },
      });
    }

    return funnel;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        stages: z.array(
          z.object({
            name: z.string().min(1),
            color: z.string().min(4),
            icon: z.string().default("circle"),
          })
        ).min(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.funnel.create({
        data: {
          officeId: ctx.dbUser.officeId,
          name: input.name,
          stages: {
            create: input.stages.map((s, i) => ({ ...s, order: i })),
          },
        },
        include: { stages: { orderBy: { order: "asc" } } },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await ctx.prisma.funnel.findFirst({
        where: { id, officeId: ctx.dbUser.officeId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.funnel.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.funnel.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.isDefault) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Não é possível excluir o funil padrão" });
      }

      return ctx.prisma.funnel.delete({ where: { id: input.id } });
    }),

  // Stage management
  addStage: protectedProcedure
    .input(
      z.object({
        funnelId: z.string(),
        name: z.string().min(1),
        color: z.string().min(4),
        icon: z.string().default("circle"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const funnel = await ctx.prisma.funnel.findFirst({
        where: { id: input.funnelId, officeId: ctx.dbUser.officeId },
      });
      if (!funnel) throw new TRPCError({ code: "NOT_FOUND" });

      const count = await ctx.prisma.funnelStage.count({
        where: { funnelId: input.funnelId },
      });

      return ctx.prisma.funnelStage.create({
        data: {
          funnelId: input.funnelId,
          name: input.name,
          color: input.color,
          icon: input.icon,
          order: count,
        },
      });
    }),

  updateStage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        color: z.string().min(4).optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const stage = await ctx.prisma.funnelStage.findUnique({
        where: { id },
        include: { funnel: true },
      });
      if (!stage || stage.funnel.officeId !== ctx.dbUser.officeId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.funnelStage.update({ where: { id }, data });
    }),

  deleteStage: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const stage = await ctx.prisma.funnelStage.findUnique({
        where: { id: input.id },
        include: { funnel: true },
      });
      if (!stage || stage.funnel.officeId !== ctx.dbUser.officeId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.funnelStage.delete({ where: { id: input.id } });
    }),

  // Move lead to a stage
  moveLeadToStage: protectedProcedure
    .input(z.object({ leadId: z.string(), stageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.prisma.lead.findFirst({
        where: { id: input.leadId, officeId: ctx.dbUser.officeId },
      });
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.lead.update({
        where: { id: input.leadId },
        data: { funnelStageId: input.stageId },
      });
    }),
});
