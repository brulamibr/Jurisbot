import { prisma } from "@/lib/prisma";

export async function saveSessionData(instanceId: string, data: unknown) {
  await prisma.whatsappInstance.update({
    where: { id: instanceId },
    data: { sessionData: data as object },
  });
}

export async function loadSessionData(instanceId: string) {
  const instance = await prisma.whatsappInstance.findUnique({
    where: { id: instanceId },
    select: { sessionData: true },
  });
  return instance?.sessionData;
}

export async function updateInstanceStatus(
  instanceId: string,
  status: "CONNECTED" | "DISCONNECTED" | "CONNECTING" | "QR_READY",
  extra?: { phone?: string; qrCode?: string | null }
) {
  await prisma.whatsappInstance.update({
    where: { id: instanceId },
    data: { status, ...extra },
  });
}
