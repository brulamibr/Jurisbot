export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reconnectAllInstances } = await import("@/lib/whatsapp");
    reconnectAllInstances().catch((err) => {
      console.error("[WhatsApp] Startup reconnect failed:", err);
    });
  }
}
