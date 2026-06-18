import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  connectInstance,
  disconnectInstance,
  getQrCode,
  setMessageHandler,
  handleIncomingMessages,
  sendMessage,
} from "@/lib/whatsapp";

// Wire up the message handler on module load
setMessageHandler(handleIncomingMessages);

export const whatsappRouter = router({
  listInstances: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.whatsappInstance.findMany({
      where: { officeId: ctx.dbUser.officeId },
      orderBy: { createdAt: "asc" },
    });
  }),

  createInstance: adminProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.whatsappInstance.create({
        data: {
          officeId: ctx.dbUser.officeId,
          name: input.name,
        },
      });
    }),

  connect: adminProcedure
    .input(z.object({ instanceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.whatsappInstance.findFirst({
        where: {
          id: input.instanceId,
          officeId: ctx.dbUser.officeId,
        },
      });

      if (!instance) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const result = await connectInstance(instance.id, instance.officeId);
      return result;
    }),

  disconnect: adminProcedure
    .input(z.object({ instanceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.whatsappInstance.findFirst({
        where: {
          id: input.instanceId,
          officeId: ctx.dbUser.officeId,
        },
      });

      if (!instance) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await disconnectInstance(instance.id);
      return { success: true };
    }),

  getQrCode: protectedProcedure
    .input(z.object({ instanceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const instance = await ctx.prisma.whatsappInstance.findFirst({
        where: {
          id: input.instanceId,
          officeId: ctx.dbUser.officeId,
        },
      });

      if (!instance) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const qrCode = await getQrCode(instance.id);
      return { qrCode, status: instance.status };
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        instanceId: z.string(),
        phone: z.string(),
        text: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.whatsappInstance.findFirst({
        where: {
          id: input.instanceId,
          officeId: ctx.dbUser.officeId,
          status: "CONNECTED",
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Instância não conectada",
        });
      }

      await sendMessage(instance.id, input.phone, input.text);
      return { success: true };
    }),

  deleteInstance: adminProcedure
    .input(z.object({ instanceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.whatsappInstance.findFirst({
        where: {
          id: input.instanceId,
          officeId: ctx.dbUser.officeId,
        },
      });

      if (!instance) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await disconnectInstance(instance.id);

      return ctx.prisma.whatsappInstance.delete({
        where: { id: instance.id },
      });
    }),
});
