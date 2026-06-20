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

  getApiKeys: adminProcedure.query(async ({ ctx }) => {
    const office = await ctx.prisma.office.findUnique({
      where: { id: ctx.dbUser.officeId },
      select: {
        openaiApiKey: true,
        googleApiKey: true,
        anthropicApiKey: true,
      },
    });

    if (!office) return { openai: "", google: "", anthropic: "" };

    return {
      openai: office.openaiApiKey ? maskKey(office.openaiApiKey) : "",
      google: office.googleApiKey ? maskKey(office.googleApiKey) : "",
      anthropic: office.anthropicApiKey ? maskKey(office.anthropicApiKey) : "",
    };
  }),

  updateApiKeys: adminProcedure
    .input(
      z.object({
        openaiApiKey: z.string().optional(),
        googleApiKey: z.string().optional(),
        anthropicApiKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data: Record<string, string | null> = {};

      if (input.openaiApiKey !== undefined) {
        data.openaiApiKey = input.openaiApiKey || null;
      }
      if (input.googleApiKey !== undefined) {
        data.googleApiKey = input.googleApiKey || null;
      }
      if (input.anthropicApiKey !== undefined) {
        data.anthropicApiKey = input.anthropicApiKey || null;
      }

      return ctx.prisma.office.update({
        where: { id: ctx.dbUser.officeId },
        data,
      });
    }),
});

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}
