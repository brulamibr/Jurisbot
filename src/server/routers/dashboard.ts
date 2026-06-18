import { router, protectedProcedure } from "../trpc";

export const dashboardRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    const officeId = ctx.dbUser.officeId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      activeConversations,
      leadsToday,
      hotLeads,
      activeProcesses,
      totalLeads,
      leadsByScore,
      leadsByArea,
      recentConversations,
    ] = await Promise.all([
      ctx.prisma.conversation.count({
        where: {
          officeId,
          status: { in: ["BOT_ACTIVE", "HUMAN_ACTIVE", "WAITING"] },
        },
      }),
      ctx.prisma.lead.count({
        where: { officeId, createdAt: { gte: today } },
      }),
      ctx.prisma.lead.count({
        where: { officeId, score: "HOT" },
      }),
      ctx.prisma.process.count({
        where: { officeId },
      }),
      ctx.prisma.lead.count({
        where: { officeId },
      }),
      ctx.prisma.lead.groupBy({
        by: ["score"],
        where: { officeId },
        _count: true,
      }),
      ctx.prisma.lead.groupBy({
        by: ["legalArea"],
        where: { officeId, legalArea: { not: null } },
        _count: true,
        orderBy: { _count: { legalArea: "desc" } },
        take: 6,
      }),
      ctx.prisma.conversation.findMany({
        where: { officeId },
        include: {
          contact: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: "desc" },
        take: 5,
      }),
    ]);

    return {
      activeConversations,
      leadsToday,
      hotLeads,
      activeProcesses,
      totalLeads,
      leadsByScore: leadsByScore.map((g) => ({
        score: g.score,
        count: g._count,
      })),
      leadsByArea: leadsByArea.map((g) => ({
        area: g.legalArea ?? "Não definida",
        count: g._count,
      })),
      recentConversations: recentConversations.map((c) => ({
        id: c.id,
        contactName: c.contact.name ?? c.contact.phone,
        contactPhone: c.contact.phone,
        contactType: c.contact.type,
        status: c.status,
        lastMessage: c.messages[0]?.content ?? null,
        lastMessageAt: c.lastMessageAt,
      })),
    };
  }),

  whatsappStatus: protectedProcedure.query(async ({ ctx }) => {
    const instances = await ctx.prisma.whatsappInstance.findMany({
      where: { officeId: ctx.dbUser.officeId },
      select: { id: true, name: true, phone: true, status: true },
      orderBy: { createdAt: "asc" },
    });
    return instances;
  }),
});
