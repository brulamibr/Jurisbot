import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const conversationRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum(["BOT_ACTIVE", "HUMAN_ACTIVE", "WAITING", "CLOSED"])
            .optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.conversation.findMany({
        where: {
          officeId: ctx.dbUser.officeId,
          ...(input?.status ? { status: input.status } : {}),
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
          contact: true,
          assignedTo: { select: { id: true, name: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.conversation.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
        include: {
          contact: { include: { lead: true, processes: true } },
          assignedTo: { select: { id: true, name: true, avatar: true } },
          whatsappInstance: { select: { id: true, name: true, status: true } },
        },
      });

      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return conversation;
    }),

  messages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.conversation.findFirst({
        where: { id: input.conversationId, officeId: ctx.dbUser.officeId },
      });

      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const messages = await ctx.prisma.message.findMany({
        where: { conversationId: input.conversationId },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          sentByUser: { select: { id: true, name: true } },
        },
      });

      let nextCursor: string | undefined;
      if (messages.length > input.limit) {
        const next = messages.pop();
        nextCursor = next?.id;
      }

      return { messages: messages.reverse(), nextCursor };
    }),

  takeOver: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.conversation.findFirst({
        where: { id: input.conversationId, officeId: ctx.dbUser.officeId },
      });

      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.conversation.update({
        where: { id: input.conversationId },
        data: {
          status: "HUMAN_ACTIVE",
          assignedToId: ctx.dbUser.id,
          humanTakeoverAt: new Date(),
        },
      });
    }),

  returnToBot: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.conversation.findFirst({
        where: { id: input.conversationId, officeId: ctx.dbUser.officeId },
      });

      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.conversation.update({
        where: { id: input.conversationId },
        data: {
          status: "BOT_ACTIVE",
          assignedToId: null,
          humanTakeoverAt: null,
        },
      });
    }),

  close: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.conversation.update({
        where: { id: input.conversationId },
        data: { status: "CLOSED" },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.conversation.findFirst({
        where: { id: input.conversationId, officeId: ctx.dbUser.officeId },
      });

      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.prisma.message.deleteMany({
        where: { conversationId: input.conversationId },
      });

      return ctx.prisma.conversation.delete({
        where: { id: input.conversationId },
      });
    }),

  startNew: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(8),
        name: z.string().optional(),
        content: z.string().min(1),
        personaId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cleanPhone = input.phone.replace(/\D/g, "");

      const instance = await ctx.prisma.whatsappInstance.findFirst({
        where: { officeId: ctx.dbUser.officeId, status: "CONNECTED" },
      });
      if (!instance) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma instância WhatsApp conectada" });
      }

      const persona = await ctx.prisma.persona.findFirst({
        where: { id: input.personaId, officeId: ctx.dbUser.officeId, isActive: true },
      });
      if (!persona) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Persona não encontrada" });
      }

      const contact = await ctx.prisma.contact.upsert({
        where: {
          officeId_phone: { officeId: ctx.dbUser.officeId, phone: cleanPhone },
        },
        create: {
          officeId: ctx.dbUser.officeId,
          phone: cleanPhone,
          name: input.name || null,
          type: "LEAD",
        },
        update: {
          ...(input.name ? { name: input.name } : {}),
        },
      });

      const conversation = await ctx.prisma.conversation.create({
        data: {
          officeId: ctx.dbUser.officeId,
          contactId: contact.id,
          whatsappInstanceId: instance.id,
          status: "HUMAN_ACTIVE",
          assignedToId: ctx.dbUser.id,
          humanTakeoverAt: new Date(),
          lastMessageAt: new Date(),
        },
      });

      const signature = `\n\n— *${persona.name}*, ${persona.role}`;
      const fullContent = input.content + signature;

      await ctx.prisma.message.create({
        data: {
          conversationId: conversation.id,
          sender: "USER",
          content: input.content,
          type: "TEXT",
          sentByUserId: ctx.dbUser.id,
          metadata: { personaId: persona.id, personaName: persona.name, personaRole: persona.role },
        },
      });

      const { sendMessage: send } = await import("@/lib/whatsapp");
      await send(instance.id, cleanPhone, fullContent);

      return conversation;
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        content: z.string().min(1),
        personaId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.conversation.findFirst({
        where: { id: input.conversationId, officeId: ctx.dbUser.officeId },
        include: {
          contact: true,
          whatsappInstance: true,
        },
      });

      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const persona = await ctx.prisma.persona.findFirst({
        where: { id: input.personaId, officeId: ctx.dbUser.officeId, isActive: true },
      });

      if (!persona) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Selecione uma persona válida" });
      }

      const signature = `\n\n— *${persona.name}*, ${persona.role}`;
      const fullContent = input.content + signature;

      const message = await ctx.prisma.message.create({
        data: {
          conversationId: input.conversationId,
          sender: "USER",
          content: input.content,
          type: "TEXT",
          sentByUserId: ctx.dbUser.id,
          metadata: { personaId: persona.id, personaName: persona.name, personaRole: persona.role },
        },
      });

      await ctx.prisma.conversation.update({
        where: { id: input.conversationId },
        data: { lastMessageAt: new Date() },
      });

      if (conversation.whatsappInstance.status === "CONNECTED") {
        const { sendMessage } = await import("@/lib/whatsapp");
        await sendMessage(
          conversation.whatsappInstanceId,
          conversation.contact.phone,
          fullContent
        );
      }

      return message;
    }),
});
