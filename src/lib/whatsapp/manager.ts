import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
  type BaileysEventMap,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as QRCode from "qrcode";
import { updateInstanceStatus } from "./session-store";
import { usePrismaAuthState } from "./prisma-auth-state";
import { prisma } from "@/lib/prisma";

type MessageHandler = (
  instanceId: string,
  message: BaileysEventMap["messages.upsert"]
) => Promise<void>;

interface ActiveSession {
  socket: WASocket;
  instanceId: string;
  officeId: string;
  retryCount: number;
  reconnectTimer?: ReturnType<typeof setTimeout>;
}

const sessions = new Map<string, ActiveSession>();
const MAX_RETRIES = 3;

let onMessageHandler: MessageHandler | null = null;

export function setMessageHandler(handler: MessageHandler) {
  onMessageHandler = handler;
}

async function clearSessionData(instanceId: string) {
  await prisma.$transaction([
    prisma.whatsappAuthKey.deleteMany({ where: { instanceId } }),
    prisma.whatsappInstance.update({
      where: { id: instanceId },
      data: { sessionData: { unset: true }, qrCode: null },
    }),
  ]);
}

export async function connectInstance(
  instanceId: string,
  officeId: string
): Promise<{ qrDataUrl: string | null }> {
  if (sessions.has(instanceId)) {
    const existing = sessions.get(instanceId)!;
    if (existing.socket.user) {
      return { qrDataUrl: null };
    }
    // Clean up stale session before reconnecting
    try { existing.socket.end(undefined); } catch {}
    if (existing.reconnectTimer) clearTimeout(existing.reconnectTimer);
    sessions.delete(instanceId);
  }

  await updateInstanceStatus(instanceId, "CONNECTING");

  const { state, saveCreds } = await usePrismaAuthState(instanceId);
  const { version } = await fetchLatestBaileysVersion();

  let qrDataUrl: string | null = null;

  const socket = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, undefined as never),
    },
    printQRInTerminal: false,
    generateHighQualityLinkPreview: false,
  });

  const session: ActiveSession = { socket, instanceId, officeId, retryCount: 0 };
  sessions.set(instanceId, session);

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrDataUrl = await QRCode.toDataURL(qr);
      await updateInstanceStatus(instanceId, "QR_READY", {
        qrCode: qrDataUrl,
      });
    }

    if (connection === "close") {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
      sessions.delete(instanceId);

      if (reason === DisconnectReason.loggedOut) {
        await updateInstanceStatus(instanceId, "DISCONNECTED", {
          qrCode: null,
        });
        await clearSessionData(instanceId);
      } else {
        session.retryCount++;
        await updateInstanceStatus(instanceId, "DISCONNECTED");

        if (session.retryCount >= MAX_RETRIES) {
          console.log(
            `[WhatsApp] Instance ${instanceId}: max retries (${MAX_RETRIES}) reached, clearing corrupted session`
          );
          await clearSessionData(instanceId);
          return;
        }

        const delay = Math.min(5000 * session.retryCount, 30000);
        session.reconnectTimer = setTimeout(() => {
          connectInstance(instanceId, officeId);
        }, delay);
      }
    }

    if (connection === "open") {
      session.retryCount = 0;
      const phone = socket.user?.id.split(":")[0] ?? undefined;
      await updateInstanceStatus(instanceId, "CONNECTED", {
        phone,
        qrCode: null,
      });
    }
  });

  socket.ev.on("messages.upsert", async (upsert) => {
    if (onMessageHandler) {
      await onMessageHandler(instanceId, upsert);
    }
  });

  return { qrDataUrl };
}

export async function disconnectInstance(instanceId: string) {
  const session = sessions.get(instanceId);
  if (session) {
    if (session.reconnectTimer) clearTimeout(session.reconnectTimer);
    try { session.socket.end(undefined); } catch {}
    sessions.delete(instanceId);
  }
  await updateInstanceStatus(instanceId, "DISCONNECTED", { qrCode: null });
}

export async function sendMessage(
  instanceId: string,
  phone: string,
  text: string
) {
  const session = sessions.get(instanceId);
  if (!session) {
    throw new Error("WhatsApp instance not connected");
  }

  const jid = phone.includes("@") ? phone : `${phone}@s.whatsapp.net`;
  await session.socket.sendMessage(jid, { text });
}

export async function resolvePhoneFromLid(
  instanceId: string,
  lidJid: string
): Promise<string | null> {
  const session = sessions.get(instanceId);
  if (!session) return null;

  try {
    const store = (session.socket as Record<string, unknown>)["store"] as
      | { contacts?: Record<string, { id?: string; notify?: string }> }
      | undefined;

    if (store?.contacts?.[lidJid]?.id) {
      return store.contacts[lidJid].id.split("@")[0];
    }

    const results = await session.socket.onWhatsApp(lidJid);
    const result = results?.[0];
    if (result?.exists && result.jid) {
      return result.jid.split("@")[0];
    }
  } catch {
    // Resolution failed — fall through
  }

  return null;
}

export function getSession(instanceId: string) {
  return sessions.get(instanceId) ?? null;
}

export function isConnected(instanceId: string) {
  const session = sessions.get(instanceId);
  return session?.socket.user != null;
}

export async function getQrCode(instanceId: string): Promise<string | null> {
  const instance = await prisma.whatsappInstance.findUnique({
    where: { id: instanceId },
    select: { qrCode: true, status: true },
  });
  return instance?.qrCode ?? null;
}
