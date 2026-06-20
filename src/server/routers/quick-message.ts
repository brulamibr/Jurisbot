import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const quickMessageRouter = router({
  // ─── Categories ────────────────────────────────────────────────────
  listCategories: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.quickMessageCategory.findMany({
      where: { officeId: ctx.dbUser.officeId },
      include: {
        messages: { orderBy: { order: "asc" } },
      },
      orderBy: { order: "asc" },
    });
  }),

  createCategory: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.prisma.quickMessageCategory.count({
        where: { officeId: ctx.dbUser.officeId },
      });
      return ctx.prisma.quickMessageCategory.create({
        data: {
          officeId: ctx.dbUser.officeId,
          name: input.name,
          order: count,
        },
      });
    }),

  updateCategory: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.quickMessageCategory.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.quickMessageCategory.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),

  deleteCategory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.quickMessageCategory.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.quickMessageCategory.delete({ where: { id: input.id } });
    }),

  // ─── Messages ─────────────────────────────────────────────────────
  createMessage: protectedProcedure
    .input(
      z.object({
        categoryId: z.string(),
        title: z.string().min(1),
        content: z.string().min(1),
        fileUrl: z.string().optional(),
        fileName: z.string().optional(),
        fileType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.quickMessageCategory.findFirst({
        where: { id: input.categoryId, officeId: ctx.dbUser.officeId },
      });
      if (!category) throw new TRPCError({ code: "NOT_FOUND" });

      const count = await ctx.prisma.quickMessage.count({
        where: { categoryId: input.categoryId },
      });

      return ctx.prisma.quickMessage.create({
        data: { ...input, order: count },
      });
    }),

  updateMessage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        fileUrl: z.string().nullable().optional(),
        fileName: z.string().nullable().optional(),
        fileType: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const msg = await ctx.prisma.quickMessage.findUnique({
        where: { id },
        include: { category: true },
      });
      if (!msg || msg.category.officeId !== ctx.dbUser.officeId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.quickMessage.update({ where: { id }, data });
    }),

  deleteMessage: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const msg = await ctx.prisma.quickMessage.findUnique({
        where: { id: input.id },
        include: { category: true },
      });
      if (!msg || msg.category.officeId !== ctx.dbUser.officeId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.quickMessage.delete({ where: { id: input.id } });
    }),
});
