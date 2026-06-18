import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { listAvailableProviders } from "@/lib/ai";

export const aiConfigRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.aiConfig.findMany({
      where: { officeId: ctx.dbUser.officeId },
      orderBy: { createdAt: "asc" },
    });
  }),

  getDefault: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.aiConfig.findFirst({
      where: { officeId: ctx.dbUser.officeId, isDefault: true },
    });
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        systemPrompt: z.string().min(1),
        model: z.string().default("gpt-4o"),
        temperature: z.number().min(0).max(2).default(0.7),
        maxTokens: z.number().min(100).max(4096).default(1024),
        legalAreas: z.array(z.string()).default([]),
        isDefault: z.boolean().default(false),
        businessHours: z.record(z.string(), z.unknown()).default({}),
        offHoursMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.isDefault) {
        await ctx.prisma.aiConfig.updateMany({
          where: { officeId: ctx.dbUser.officeId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return ctx.prisma.aiConfig.create({
        data: {
          officeId: ctx.dbUser.officeId,
          ...input,
          businessHours: input.businessHours as object,
        },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        systemPrompt: z.string().min(1).optional(),
        model: z.string().optional(),
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().min(100).max(4096).optional(),
        legalAreas: z.array(z.string()).optional(),
        isDefault: z.boolean().optional(),
        businessHours: z.record(z.string(), z.unknown()).optional(),
        offHoursMessage: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.prisma.aiConfig.findFirst({
        where: { id, officeId: ctx.dbUser.officeId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (data.isDefault) {
        await ctx.prisma.aiConfig.updateMany({
          where: { officeId: ctx.dbUser.officeId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return ctx.prisma.aiConfig.update({
        where: { id },
        data: {
          ...data,
          businessHours: data.businessHours as object | undefined,
        },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.aiConfig.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.aiConfig.delete({ where: { id: input.id } });
    }),

  availableProviders: protectedProcedure.query(() => {
    return listAvailableProviders();
  }),
});
