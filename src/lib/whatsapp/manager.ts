import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
  type BaileysEventMap,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { updateInstanceStatus } from "./session-store";
import { prisma } from "@/lib/prisma";

type MessageHandler = (
  instanceId: string,
  message: BaileysEventMap["messages.upsert"]
) => Promise<void>;

interface ActiveSession {
  socket: WASocket;
  instanceId: string;
  officeId: string;
}

const sessions = new Map<string, ActiveSession>();

const AUTH_DIR = path.join(process.cwd(), ".whatsapp-sessions");

function getAuthDir(instanceId: string) {
  const dir = path.join(AUTH_DIR, instanceId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

let onMessageHandler: MessageHandler | null = null;

export function setMessageHandler(handler: MessageHandler) {
  onMessageHandler = handler;
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
  }

  await updateInstanceStatus(instanceId, "CONNECTING");

  const authDir = getAuthDir(instanceId);
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
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

  const session: ActiveSession = { socket, instanceId, officeId };
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
        // Clean auth state on logout
        if (fs.existsSync(authDir)) {
          fs.rmSync(authDir, { recursive: true, force: true });
        }
      } else {
        // Reconnect on other disconnect reasons
        await updateInstanceStatus(instanceId, "DISCONNECTED");
        setTimeout(() => connectInstance(instanceId, officeId), 5000);
      }
    }

    if (connection === "open") {
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
    session.socket.end(undefined);
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
