import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const broadcastRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.broadcast.findMany({
      where: { officeId: ctx.dbUser.officeId },
      include: {
        persona: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const broadcast = await ctx.prisma.broadcast.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
        include: {
          persona: true,
          recipients: { orderBy: { name: "asc" }, take: 100 },
        },
      });
      if (!broadcast) throw new TRPCError({ code: "NOT_FOUND" });
      return broadcast;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        personaId: z.string(),
        content: z.string().min(1),
        fileUrl: z.string().optional(),
        fileName: z.string().optional(),
        audienceType: z.enum(["ALL_CONTACTS", "BY_LABEL", "BY_GROUP", "BY_FUNNEL", "IMPORT_EXCEL"]),
        audienceFilter: z.record(z.string(), z.unknown()).default({}),
        recipients: z.array(z.object({ phone: z.string(), name: z.string().optional() })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { recipients, ...data } = input;

      const broadcast = await ctx.prisma.broadcast.create({
        data: {
          officeId: ctx.dbUser.officeId,
          ...data,
          audienceFilter: data.audienceFilter as object,
          totalRecipients: recipients.length,
          status: "DRAFT",
        },
      });

      if (recipients.length > 0) {
        await ctx.prisma.broadcastRecipient.createMany({
          data: recipients.map((r) => ({
            broadcastId: broadcast.id,
            phone: r.phone,
            name: r.name ?? null,
          })),
        });
      }

      return broadcast;
    }),

  send: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const broadcast = await ctx.prisma.broadcast.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId, status: "DRAFT" },
        include: {
          persona: true,
          recipients: { where: { status: "PENDING" } },
          office: {
            include: {
              whatsappInstances: { where: { status: "CONNECTED" }, take: 1 },
            },
          },
        },
      });

      if (!broadcast) throw new TRPCError({ code: "NOT_FOUND" });

      const instance = broadcast.office.whatsappInstances[0];
      if (!instance) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma instância WhatsApp conectada" });
      }

      await ctx.prisma.broadcast.update({
        where: { id: broadcast.id },
        data: { status: "SENDING", startedAt: new Date() },
      });

      const signature = `\n\n— *${broadcast.persona.name}*, ${broadcast.persona.role}`;
      const fullContent = broadcast.content + signature;
      let sentCount = 0;
      let failedCount = 0;

      const { sendMessage } = await import("@/lib/whatsapp");

      for (const recipient of broadcast.recipients) {
        try {
          await sendMessage(instance.id, recipient.phone, fullContent);
          await ctx.prisma.broadcastRecipient.update({
            where: { id: recipient.id },
            data: { status: "SENT", sentAt: new Date() },
          });
          sentCount++;
          // 1.5s delay between messages to avoid WhatsApp rate limiting
          await new Promise((r) => setTimeout(r, 1500));
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : "Unknown error";
          await ctx.prisma.broadcastRecipient.update({
            where: { id: recipient.id },
            data: { status: "FAILED", error: errMsg },
          });
          failedCount++;
        }
      }

      await ctx.prisma.broadcast.update({
        where: { id: broadcast.id },
        data: {
          status: "COMPLETED",
          sentCount,
          failedCount,
          completedAt: new Date(),
        },
      });

      return { sentCount, failedCount };
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.broadcast.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.broadcast.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.broadcast.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.broadcast.delete({ where: { id: input.id } });
    }),

  // Audience helpers
  contactsByLabel: protectedProcedure
    .input(z.object({ labelIds: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const leadLabels = await ctx.prisma.leadLabel.findMany({
        where: { labelId: { in: input.labelIds }, lead: { officeId: ctx.dbUser.officeId } },
        include: { lead: { include: { contact: { select: { id: true, name: true, phone: true } } } } },
      });
      const seen = new Set<string>();
      return leadLabels
        .map((ll) => ll.lead.contact)
        .filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
    }),

  contactsByFunnel: protectedProcedure
    .input(z.object({ scores: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const leads = await ctx.prisma.lead.findMany({
        where: { officeId: ctx.dbUser.officeId, score: { in: input.scores as never[] } },
        include: { contact: { select: { id: true, name: true, phone: true } } },
      });
      return leads.map((l) => l.contact);
    }),

  allContacts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.contact.findMany({
      where: { officeId: ctx.dbUser.officeId },
      select: { id: true, name: true, phone: true, type: true },
      orderBy: { name: "asc" },
    });
  }),
});
