import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const contactRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        type: z.enum(["LEAD", "CLIENT"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.contact.findMany({
        where: {
          officeId: ctx.dbUser.officeId,
          ...(input?.type ? { type: input.type } : {}),
          ...(input?.search
            ? {
                OR: [
                  { name: { contains: input.search, mode: "insensitive" } },
                  { phone: { contains: input.search } },
                  { email: { contains: input.search, mode: "insensitive" } },
                  { cpf: { contains: input.search } },
                ],
              }
            : {}),
        },
        include: {
          lead: { select: { id: true, score: true } },
          _count: { select: { conversations: true, processes: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const contact = await ctx.prisma.contact.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
        include: {
          lead: {
            include: {
              labels: { include: { label: true } },
            },
          },
          processes: { select: { id: true, number: true, subject: true, status: true } },
          _count: { select: { conversations: true } },
        },
      });
      if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
      return contact;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().nullable().optional(),
        cpf: z.string().nullable().optional(),
        rg: z.string().nullable().optional(),
        birthDate: z.string().nullable().optional(),
        type: z.enum(["LEAD", "CLIENT"]).optional(),
        legalArea: z.string().nullable().optional(),
        company: z.string().nullable().optional(),
        occupation: z.string().nullable().optional(),
        address: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        state: z.string().nullable().optional(),
        zipCode: z.string().nullable().optional(),
        proposalValue: z.number().nullable().optional(),
        proposalStatus: z.string().nullable().optional(),
        referralSource: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, birthDate, ...data } = input;

      const existing = await ctx.prisma.contact.findFirst({
        where: { id, officeId: ctx.dbUser.officeId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.contact.update({
        where: { id },
        data: {
          ...data,
          ...(birthDate !== undefined
            ? { birthDate: birthDate ? new Date(birthDate) : null }
            : {}),
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phone: z.string().min(8),
        email: z.string().email().optional(),
        type: z.enum(["LEAD", "CLIENT"]).default("LEAD"),
        legalArea: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.contact.create({
        data: {
          officeId: ctx.dbUser.officeId,
          ...input,
        },
      });
    }),
});
