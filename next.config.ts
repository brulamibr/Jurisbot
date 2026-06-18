import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@whiskeysockets/baileys",
    "@hapi/boom",
    "qrcode",
    "pino",
  ],
};

export default nextConfig;
