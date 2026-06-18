import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const knowledgeRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum(["PROCESSING", "READY", "ERROR"])
            .optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.knowledgeDocument.findMany({
        where: {
          officeId: ctx.dbUser.officeId,
          ...(input?.status ? { status: input.status } : {}),
          ...(input?.search
            ? { title: { contains: input.search, mode: "insensitive" } }
            : {}),
        },
        include: {
          _count: { select: { chunks: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.prisma.knowledgeDocument.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
        include: {
          _count: { select: { chunks: true } },
        },
      });

      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return doc;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.knowledgeDocument.create({
        data: {
          ...input,
          officeId: ctx.dbUser.officeId,
          status: "PROCESSING",
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.knowledgeDocument.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
      });

      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.knowledgeDocument.delete({
        where: { id: input.id },
      });
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const [total, ready, processing, error] = await Promise.all([
      ctx.prisma.knowledgeDocument.count({
        where: { officeId: ctx.dbUser.officeId },
      }),
      ctx.prisma.knowledgeDocument.count({
        where: { officeId: ctx.dbUser.officeId, status: "READY" },
      }),
      ctx.prisma.knowledgeDocument.count({
        where: { officeId: ctx.dbUser.officeId, status: "PROCESSING" },
      }),
      ctx.prisma.knowledgeDocument.count({
        where: { officeId: ctx.dbUser.officeId, status: "ERROR" },
      }),
    ]);

    const totalChunks = await ctx.prisma.knowledgeChunk.count({
      where: { document: { officeId: ctx.dbUser.officeId } },
    });

    return { total, ready, processing, error, totalChunks };
  }),
});
