export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

function calculateNextSendAt(current: Date, recurrence: string): Date {
  const next = new Date(current);
  switch (recurrence) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const dueMessages = await prisma.scheduledMessage.findMany({
    where: {
      status: { in: ["PENDING", "ACTIVE"] },
      nextSendAt: { lte: now },
    },
    include: {
      contact: true,
      persona: true,
      office: {
        include: {
          whatsappInstances: {
            where: { status: "CONNECTED" },
            take: 1,
          },
        },
      },
    },
  });

  let sent = 0;
  let errors = 0;

  for (const msg of dueMessages) {
    try {
      const instance = msg.office.whatsappInstances[0];
      if (!instance) {
        console.error(`No connected WhatsApp for office ${msg.officeId}`);
        errors++;
        continue;
      }

      const signature = `\n\n— *${msg.persona.name}*, ${msg.persona.role}`;
      const fullContent = msg.content + signature;

      const { sendMessage } = await import("@/lib/whatsapp");

      if (msg.fileUrl) {
        await sendMessage(instance.id, msg.contact.phone, fullContent);
      } else {
        await sendMessage(instance.id, msg.contact.phone, fullContent);
      }

      const newSentCount = msg.sentCount + 1;
      const isComplete = newSentCount >= msg.recurrenceCount;

      if (isComplete || msg.recurrence === "NONE") {
        await prisma.scheduledMessage.update({
          where: { id: msg.id },
          data: {
            sentCount: newSentCount,
            lastSentAt: now,
            status: "COMPLETED",
          },
        });
      } else {
        const nextSendAt = calculateNextSendAt(msg.nextSendAt, msg.recurrence);
        await prisma.scheduledMessage.update({
          where: { id: msg.id },
          data: {
            sentCount: newSentCount,
            lastSentAt: now,
            nextSendAt,
            status: "ACTIVE",
          },
        });
      }

      sent++;
    } catch (error) {
      console.error(`Failed to send scheduled message ${msg.id}:`, error);
      errors++;
    }
  }

  return NextResponse.json({
    processed: dueMessages.length,
    sent,
    errors,
    timestamp: now.toISOString(),
  });
}
