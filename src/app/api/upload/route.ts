import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { createDocument } from "@/lib/db";
import mammoth from "mammoth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["text/plain", "text/markdown", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

function textToTiptap(text: string): string {
  // Convert plain text to TipTap JSON structure
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  const content = paragraphs.map((para) => {
    const lines = para.split("\n").filter(Boolean);
    return {
      type: "paragraph",
      content: lines.map((line, i) => {
        const parts: object[] = [{ type: "text", text: line }];
        if (i < lines.length - 1) parts.push({ type: "hardBreak" });
        return parts;
      }).flat(),
    };
  });

  return JSON.stringify({ type: "doc", content: content.length ? content : [{ type: "paragraph" }] });
}

function mdToTiptap(markdown: string): string {
  // Basic markdown → TipTap JSON conversion
  const lines = markdown.split("\n");
  const content: object[] = [];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      content.push({ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: line.slice(2) }] });
    } else if (line.startsWith("## ")) {
      content.push({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: line.slice(3) }] });
    } else if (line.startsWith("### ")) {
      content.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: line.slice(4) }] });
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      content.push({ type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: line.slice(2) }] }] }] });
    } else if (line.match(/^\d+\. /)) {
      content.push({ type: "orderedList", attrs: { start: 1 }, content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: line.replace(/^\d+\. /, "") }] }] }] });
    } else if (line.trim() === "") {
      // skip empty lines
    } else {
      // Handle **bold** and _italic_ inline
      content.push({ type: "paragraph", content: [{ type: "text", text: line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/_(.*?)_/g, "$1") }] });
    }
  }

  return JSON.stringify({ type: "doc", content: content.length ? content : [{ type: "paragraph" }] });
}

export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const targetDocId = formData.get("targetDocId") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });

  const fileName = file.name;
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (!["txt", "md", "docx"].includes(ext ?? "")) {
    return NextResponse.json({ error: "Only .txt, .md, and .docx files are supported" }, { status: 400 });
  }

  let content: string;
  const title = fileName.replace(/\.(txt|md|docx)$/, "");

  if (ext === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.extractRawText({ buffer });
    content = textToTiptap(result.value);
  } else if (ext === "md") {
    const text = await file.text();
    content = mdToTiptap(text);
  } else {
    const text = await file.text();
    content = textToTiptap(text);
  }

  const doc = createDocument({
    title,
    content,
    ownerId: payload.userId,
  });

  return NextResponse.json({ doc }, { status: 201 });
}
