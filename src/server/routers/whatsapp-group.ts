import { z } from "zod";
import { router, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  createGroup,
  getGroups,
  getGroupMetadata,
  updateGroupParticipants,
  updateGroupSubject,
  getGroupInviteCode,
} from "@/lib/whatsapp";

export const whatsappGroupRouter = router({
  list: adminProcedure
    .input(z.object({ instanceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const instance = await ctx.prisma.whatsappInstance.findFirst({
        where: { id: input.instanceId, officeId: ctx.dbUser.officeId, status: "CONNECTED" },
      });
      if (!instance) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Instância não conectada" });
      }

      const groups = await getGroups(instance.id);
      return groups.map((g) => ({
        id: g.id,
        subject: g.subject,
        owner: g.owner,
        creation: g.creation,
        size: g.size ?? g.participants?.length ?? 0,
        participants: g.participants?.map((p) => ({
          id: p.id,
          admin: p.admin,
        })) ?? [],
      }));
    }),

  create: adminProcedure
    .input(
      z.object({
        instanceId: z.string(),
        subject: z.string().min(1).max(100),
        participants: z.array(z.string().min(8)).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.whatsappInstance.findFirst({
        where: { id: input.instanceId, officeId: ctx.dbUser.officeId, status: "CONNECTED" },
      });
      if (!instance) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Instância não conectada" });
      }

      const phones = input.participants.map((p) => p.replace(/\D/g, ""));
      const group = await createGroup(instance.id, input.subject, phones);
      return { id: group.id, subject: group.subject };
    }),

  metadata: adminProcedure
    .input(z.object({ instanceId: z.string(), groupJid: z.string() }))
    .query(async ({ ctx, input }) => {
      const instance = await ctx.prisma.whatsappInstance.findFirst({
        where: { id: input.instanceId, officeId: ctx.dbUser.officeId, status: "CONNECTED" },
      });
      if (!instance) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Instância não conectada" });
      }

      return getGroupMetadata(instance.id, input.groupJid);
    }),

  addParticipants: adminProcedure
    .input(
      z.object({
        instanceId: z.string(),
        groupJid: z.string(),
        participants: z.array(z.string().min(8)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.whatsappInstance.findFirst({
        where: { id: input.instanceId, officeId: ctx.dbUser.officeId, status: "CONNECTED" },
      });
      if (!instance) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Instância não conectada" });
      }

      const phones = input.participants.map((p) => p.replace(/\D/g, ""));
      return updateGroupParticipants(instance.id, input.groupJid, phones, "add");
    }),

  removeParticipants: adminProcedure
    .input(
      z.object({
        instanceId: z.string(),
        groupJid: z.string(),
        participants: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.whatsappInstance.findFirst({
        where: { id: input.instanceId, officeId: ctx.dbUser.officeId, status: "CONNECTED" },
      });
      if (!instance) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Instância não conectada" });
      }

      return updateGroupParticipants(instance.id, input.groupJid, input.participants, "remove");
    }),

  updateSubject: adminProcedure
    .input(
      z.object({
        instanceId: z.string(),
        groupJid: z.string(),
        subject: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.whatsappInstance.findFirst({
        where: { id: input.instanceId, officeId: ctx.dbUser.officeId, status: "CONNECTED" },
      });
      if (!instance) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Instância não conectada" });
      }

      await updateGroupSubject(instance.id, input.groupJid, input.subject);
      return { success: true };
    }),

  inviteCode: adminProcedure
    .input(z.object({ instanceId: z.string(), groupJid: z.string() }))
    .query(async ({ ctx, input }) => {
      const instance = await ctx.prisma.whatsappInstance.findFirst({
        where: { id: input.instanceId, officeId: ctx.dbUser.officeId, status: "CONNECTED" },
      });
      if (!instance) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Instância não conectada" });
      }

      const code = await getGroupInviteCode(instance.id, input.groupJid);
      return { code, link: `https://chat.whatsapp.com/${code}` };
    }),
});
