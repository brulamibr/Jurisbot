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

  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        content: z.string().min(1),
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

      const message = await ctx.prisma.message.create({
        data: {
          conversationId: input.conversationId,
          sender: "USER",
          content: input.content,
          type: "TEXT",
          sentByUserId: ctx.dbUser.id,
        },
      });

      await ctx.prisma.conversation.update({
        where: { id: input.conversationId },
        data: { lastMessageAt: new Date() },
      });

      // Send via WhatsApp if instance is connected
      if (conversation.whatsappInstance.status === "CONNECTED") {
        const { sendMessage } = await import("@/lib/whatsapp");
        await sendMessage(
          conversation.whatsappInstanceId,
          conversation.contact.phone,
          input.content
        );
      }

      return message;
    }),
});
