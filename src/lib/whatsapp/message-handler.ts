import type { BaileysEventMap } from "@whiskeysockets/baileys";
import { prisma } from "@/lib/prisma";
import { chat, buildSystemPrompt, buildConversationMessages } from "@/lib/ai";
import { sendMessage } from "./manager";

const MAX_CONTEXT_MESSAGES = 20;

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

    // Skip AI response if human has taken over
    if (conversation.status !== "BOT_ACTIVE") continue;

    try {
      const aiResponse = await generateAIResponse(
        instance.officeId,
        conversation.id,
        contact.type,
        contact.name ?? phone,
        content
      );

      if (aiResponse) {
        await sendMessage(instanceId, phone, aiResponse.content);

        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            sender: "BOT",
            content: aiResponse.content,
            type: "TEXT",
            aiModel: aiResponse.model,
            aiTokensUsed: aiResponse.tokensUsed,
            aiCost: aiResponse.cost,
          },
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: new Date(),
            aiModel: aiResponse.model,
          },
        });
      }
    } catch (error) {
      console.error("Failed to generate AI response:", error);
    }
  }
}

async function generateAIResponse(
  officeId: string,
  conversationId: string,
  contactType: string,
  contactName: string,
  newMessage: string
) {
  const office = await prisma.office.findUnique({
    where: { id: officeId },
    select: { name: true },
  });

  if (!office) return null;

  const aiConfig = await prisma.aiConfig.findFirst({
    where: { officeId, isDefault: true },
  });

  // Check business hours if configured
  if (aiConfig?.businessHours && typeof aiConfig.businessHours === "object") {
    const hours = aiConfig.businessHours as Record<string, unknown>;
    if (hours.enabled) {
      const now = new Date();
      const hour = now.getHours();
      const start = (hours.start as number) ?? 8;
      const end = (hours.end as number) ?? 18;

      if (hour < start || hour >= end) {
        return {
          content:
            aiConfig.offHoursMessage ??
            `Olá! O escritório ${office.name} funciona em horário comercial. Retornaremos seu contato assim que possível. Obrigado!`,
          model: "off-hours",
          provider: "system",
          tokensUsed: 0,
          cost: 0,
        };
      }
    }
  }

  const previousMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: MAX_CONTEXT_MESSAGES,
    select: { sender: true, content: true },
  });

  const systemPrompt = buildSystemPrompt({
    officeName: office.name,
    contactType: contactType as "LEAD" | "CLIENT",
    contactName,
    legalAreas: aiConfig?.legalAreas ?? [],
    customPrompt: aiConfig?.systemPrompt,
  });

  const history = previousMessages
    .filter((m) => m.sender === "CONTACT" || m.sender === "BOT")
    .map((m) => ({
      role: (m.sender === "CONTACT" ? "user" : "assistant") as
        | "user"
        | "assistant",
      content: m.content,
    }));

  const messages = buildConversationMessages(systemPrompt, history, newMessage);

  const preferredProvider =
    aiConfig?.model?.startsWith("gpt")
      ? "openai"
      : aiConfig?.model?.startsWith("gemini")
        ? "google"
        : aiConfig?.model?.startsWith("claude")
          ? "anthropic"
          : undefined;

  return await chat(messages, {
    model: aiConfig?.model ?? undefined,
    temperature: aiConfig?.temperature ?? 0.7,
    maxTokens: aiConfig?.maxTokens ?? 1024,
    preferredProvider,
  });
}
