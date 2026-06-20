import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const scheduledMessageRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.scheduledMessage.findMany({
      where: { officeId: ctx.dbUser.officeId },
      include: {
        contact: { select: { name: true, phone: true } },
        persona: { select: { name: true, role: true } },
      },
      orderBy: { nextSendAt: "asc" },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        personaId: z.string(),
        content: z.string().min(1),
        fileUrl: z.string().optional(),
        fileName: z.string().optional(),
        scheduledAt: z.string().transform((s) => new Date(s)),
        recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).default("NONE"),
        recurrenceCount: z.number().min(1).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const contact = await ctx.prisma.contact.findFirst({
        where: { id: input.contactId, officeId: ctx.dbUser.officeId },
      });
      if (!contact) throw new TRPCError({ code: "NOT_FOUND", message: "Contato não encontrado" });

      const persona = await ctx.prisma.persona.findFirst({
        where: { id: input.personaId, officeId: ctx.dbUser.officeId, isActive: true },
      });
      if (!persona) throw new TRPCError({ code: "NOT_FOUND", message: "Persona não encontrada" });

      return ctx.prisma.scheduledMessage.create({
        data: {
          officeId: ctx.dbUser.officeId,
          contactId: input.contactId,
          personaId: input.personaId,
          content: input.content,
          fileUrl: input.fileUrl,
          fileName: input.fileName,
          scheduledAt: input.scheduledAt,
          nextSendAt: input.scheduledAt,
          recurrence: input.recurrence,
          recurrenceCount: input.recurrence === "NONE" ? 1 : input.recurrenceCount,
          status: "PENDING",
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1).optional(),
        personaId: z.string().optional(),
        fileUrl: z.string().nullable().optional(),
        fileName: z.string().nullable().optional(),
        scheduledAt: z.string().transform((s) => new Date(s)).optional(),
        recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).optional(),
        recurrenceCount: z.number().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, scheduledAt, ...data } = input;

      const existing = await ctx.prisma.scheduledMessage.findFirst({
        where: { id, officeId: ctx.dbUser.officeId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.scheduledMessage.update({
        where: { id },
        data: {
          ...data,
          ...(scheduledAt ? { scheduledAt, nextSendAt: scheduledAt } : {}),
        },
      });
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.scheduledMessage.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.scheduledMessage.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.scheduledMessage.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.scheduledMessage.delete({ where: { id: input.id } });
    }),

  contacts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.contact.findMany({
      where: { officeId: ctx.dbUser.officeId },
      select: { id: true, name: true, phone: true, type: true },
      orderBy: { name: "asc" },
    });
  }),
});
