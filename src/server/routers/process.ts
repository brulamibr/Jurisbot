import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const processRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
          legalArea: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.process.findMany({
        where: {
          officeId: ctx.dbUser.officeId,
          ...(input?.status ? { status: input.status } : {}),
          ...(input?.legalArea ? { legalArea: input.legalArea } : {}),
          ...(input?.search
            ? {
                OR: [
                  { number: { contains: input.search } },
                  { subject: { contains: input.search, mode: "insensitive" } },
                  {
                    contact: {
                      name: { contains: input.search, mode: "insensitive" },
                    },
                  },
                ],
              }
            : {}),
        },
        include: {
          contact: { select: { name: true, phone: true } },
          _count: { select: { movements: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const process = await ctx.prisma.process.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
        include: {
          contact: true,
          movements: { orderBy: { date: "desc" } },
        },
      });

      if (!process) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return process;
    }),

  create: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        number: z.string(),
        subject: z.string().optional(),
        court: z.string().optional(),
        judge: z.string().optional(),
        legalArea: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.process.create({
        data: {
          ...input,
          officeId: ctx.dbUser.officeId,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        number: z.string().optional(),
        subject: z.string().optional(),
        court: z.string().optional(),
        judge: z.string().optional(),
        legalArea: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const process = await ctx.prisma.process.findFirst({
        where: { id, officeId: ctx.dbUser.officeId },
      });

      if (!process) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.process.update({
        where: { id },
        data,
      });
    }),

  addMovement: protectedProcedure
    .input(
      z.object({
        processId: z.string(),
        date: z.string(),
        title: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const process = await ctx.prisma.process.findFirst({
        where: { id: input.processId, officeId: ctx.dbUser.officeId },
      });

      if (!process) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.processMovement.create({
        data: {
          processId: input.processId,
          date: new Date(input.date),
          title: input.title,
          description: input.description,
        },
      });
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const [total, active, archived] = await Promise.all([
      ctx.prisma.process.count({ where: { officeId: ctx.dbUser.officeId } }),
      ctx.prisma.process.count({
        where: {
          officeId: ctx.dbUser.officeId,
          status: { not: "Arquivado" },
        },
      }),
      ctx.prisma.process.count({
        where: {
          officeId: ctx.dbUser.officeId,
          status: "Arquivado",
        },
      }),
    ]);

    return { total, active, archived };
  }),
});
