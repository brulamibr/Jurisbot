export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { processDocument } from "@/lib/rag";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { officeId: true, office: { select: { openaiApiKey: true } } },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowedTypes = [
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];
  const allowedExtensions = ["pdf", "txt", "md", "doc", "docx"];
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext ?? "")) {
    return NextResponse.json(
      { error: "Tipo de arquivo não suportado. Use PDF, DOCX ou MD." },
      { status: 400 }
    );
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File too large. Max 10MB." },
      { status: 400 }
    );
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
  const fileName = `${dbUser.officeId}/${Date.now()}_${file.name}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const serviceClient = createServiceClient();
  const { data: uploadData, error: uploadError } = await serviceClient.storage
    .from("knowledge")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = serviceClient.storage.from("knowledge").getPublicUrl(uploadData.path);

  const doc = await prisma.knowledgeDocument.create({
    data: {
      officeId: dbUser.officeId,
      title: title ?? file.name,
      fileName: file.name,
      fileUrl: publicUrl,
      fileType: fileExt,
      fileSize: file.size,
      status: "PROCESSING",
    },
  });

  const openaiKey = dbUser.office?.openaiApiKey ?? undefined;
  processDocument(doc.id, openaiKey).catch((error) => {
    console.error(`Failed to process document ${doc.id}:`, error);
  });

  return NextResponse.json({
    id: doc.id,
    status: "PROCESSING",
    message: "Document uploaded and processing started",
  });
}
