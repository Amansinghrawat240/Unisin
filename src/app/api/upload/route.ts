import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime since this route uses Buffer (not available on Edge)
export const runtime = "nodejs";

// Simple in-process file receiver that returns a data URL. For production, replace with S3/Supabase.
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Content-Type must be multipart/form-data" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file field" }, { status: 400 });
    }

    // Validate type and size
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    const type = file.type || "";
    if (!allowed.includes(type)) {
      return NextResponse.json({ error: "Only PNG, JPEG, or WEBP images are allowed" }, { status: 400 });
    }

    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "Image must be <= 5MB" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const base64 = buf.toString("base64");
    const dataUrl = `data:${type};base64,${base64}`;

    return NextResponse.json({ url: dataUrl }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Upload failed: " + (err?.message || String(err)) }, { status: 500 });
  }
}