import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const leadRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          score: z.enum(["COLD", "WARM", "HOT", "CONVERTED", "LOST"]).optional(),
          legalArea: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.lead.findMany({
        where: {
          officeId: ctx.dbUser.officeId,
          ...(input?.score ? { score: input.score } : {}),
          ...(input?.legalArea ? { legalArea: input.legalArea } : {}),
          ...(input?.search
            ? {
                contact: {
                  OR: [
                    { name: { contains: input.search, mode: "insensitive" } },
                    { phone: { contains: input.search } },
                  ],
                },
              }
            : {}),
        },
        include: {
          contact: {
            include: {
              conversations: {
                orderBy: { lastMessageAt: "desc" },
                take: 1,
                select: {
                  id: true,
                  lastMessageAt: true,
                  status: true,
                },
              },
            },
          },
          labels: {
            include: { label: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const lead = await ctx.prisma.lead.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
        include: {
          contact: {
            include: {
              conversations: {
                orderBy: { lastMessageAt: "desc" },
                take: 5,
                include: {
                  messages: { orderBy: { createdAt: "desc" }, take: 1 },
                },
              },
            },
          },
          labels: {
            include: { label: true },
          },
        },
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return lead;
    }),

  updateScore: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        score: z.enum(["COLD", "WARM", "HOT", "CONVERTED", "LOST"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.prisma.lead.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.lead.update({
        where: { id: input.id },
        data: {
          score: input.score,
          ...(input.score === "CONVERTED" ? { convertedAt: new Date() } : {}),
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        legalArea: z.string().optional(),
        problem: z.string().optional(),
        urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        income: z.string().optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
        origin: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const lead = await ctx.prisma.lead.findFirst({
        where: { id, officeId: ctx.dbUser.officeId },
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.lead.update({
        where: { id },
        data,
        include: { contact: true },
      });
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const [total, cold, warm, hot, converted, lost] = await Promise.all([
      ctx.prisma.lead.count({ where: { officeId: ctx.dbUser.officeId } }),
      ctx.prisma.lead.count({
        where: { officeId: ctx.dbUser.officeId, score: "COLD" },
      }),
      ctx.prisma.lead.count({
        where: { officeId: ctx.dbUser.officeId, score: "WARM" },
      }),
      ctx.prisma.lead.count({
        where: { officeId: ctx.dbUser.officeId, score: "HOT" },
      }),
      ctx.prisma.lead.count({
        where: { officeId: ctx.dbUser.officeId, score: "CONVERTED" },
      }),
      ctx.prisma.lead.count({
        where: { officeId: ctx.dbUser.officeId, score: "LOST" },
      }),
    ]);

    return { total, cold, warm, hot, converted, lost };
  }),
});
