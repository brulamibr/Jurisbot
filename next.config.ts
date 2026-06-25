import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@whiskeysockets/baileys",
    "@hapi/boom",
    "qrcode",
    "pino",
    "openai",
    "@google/generative-ai",
    "@anthropic-ai/sdk",
    "pdf-parse",
    "mammoth",
  ],
};

export default nextConfig;
