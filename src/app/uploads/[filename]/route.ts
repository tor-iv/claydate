import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, resolve } from "path";
import { UPLOAD_DIR } from "@/lib/constants";

const FILENAME_RE = /^[A-Za-z0-9_-]+\.jpg$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Strict filename validation — allow only safe alphanumeric filenames
  if (!FILENAME_RE.test(filename)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Defense in depth: resolve the full path and verify it stays inside UPLOAD_DIR
  const uploadDirResolved = resolve(UPLOAD_DIR);
  const filePath = resolve(join(UPLOAD_DIR, filename));

  if (!filePath.startsWith(uploadDirResolved + "/") && filePath !== uploadDirResolved) {
    // Path traversal attempt
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let data: Buffer;
  try {
    data = await readFile(filePath);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
