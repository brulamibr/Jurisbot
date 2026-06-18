import type { BaileysEventMap } from "@whiskeysockets/baileys";
import { prisma } from "@/lib/prisma";

export async function handleIncomingMessages(
  instanceId: string,
  upsert: BaileysEventMap["messages.upsert"]
) {
  if (upsert.type !== "notify") return;

  const instance = await prisma.whatsappInstance.findUnique({
    where: { id: instanceId },
    select: { officeId: true },
  });

  if (!instance) return;

  for (const msg of upsert.messages) {
    if (msg.key.fromMe) continue;
    if (!msg.message) continue;

    const phone = msg.key.remoteJid?.replace("@s.whatsapp.net", "");
    if (!phone) continue;

    const content =
      msg.message.conversation ??
      msg.message.extendedTextMessage?.text ??
      null;

    if (!content) continue;

    const contact = await prisma.contact.upsert({
      where: {
        officeId_phone: {
          officeId: instance.officeId,
          phone,
        },
      },
      create: {
        officeId: instance.officeId,
        phone,
        name: msg.pushName ?? null,
        type: "LEAD",
      },
      update: {
        name: msg.pushName ?? undefined,
      },
    });

    let conversation = await prisma.conversation.findFirst({
      where: {
        contactId: contact.id,
        whatsappInstanceId: instanceId,
        status: { in: ["BOT_ACTIVE", "HUMAN_ACTIVE", "WAITING"] },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          officeId: instance.officeId,
          contactId: contact.id,
          whatsappInstanceId: instanceId,
          status: "BOT_ACTIVE",
        },
      });

      if (contact.type === "LEAD") {
        await prisma.lead.upsert({
          where: { contactId: contact.id },
          create: {
            officeId: instance.officeId,
            contactId: contact.id,
            score: "COLD",
            origin: "whatsapp",
          },
          update: {},
        });
      }
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: "CONTACT",
        content,
        type: "TEXT",
        whatsappMsgId: msg.key.id ?? undefined,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    // AI response will be triggered here in Milestone 5
    // For now, messages are stored and visible in the dashboard
  }
}
