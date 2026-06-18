import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.dbUser.id },
      include: { office: true },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return user;
  }),

  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      where: { officeId: ctx.dbUser.officeId },
      orderBy: { name: "asc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          id: input.id,
          officeId: ctx.dbUser.officeId,
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return user;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        role: z.enum(["ADMIN", "LAWYER", "ATTENDANT"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.prisma.user.findFirst({
        where: { id, officeId: ctx.dbUser.officeId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (id === ctx.dbUser.id && data.role && data.role !== "ADMIN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Você não pode alterar sua própria permissão.",
        });
      }

      return ctx.prisma.user.update({
        where: { id },
        data,
      });
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        avatar: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.dbUser.id },
        data: input,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.dbUser.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Você não pode remover sua própria conta.",
        });
      }

      const existing = await ctx.prisma.user.findFirst({
        where: { id: input.id, officeId: ctx.dbUser.officeId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.user.delete({
        where: { id: input.id },
      });
    }),
});
