import fs from "node:fs/promises";
import { getRoastFilePathFromName } from "@/lib/storage";

const VALID_FILE = /^[a-f0-9]{64}\.mp4$/i;

export async function GET(
  _request: Request,
  { params }: { params: { file: string } }
): Promise<Response> {
  const file = params.file;

  if (!VALID_FILE.test(file)) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = getRoastFilePathFromName(file);

  try {
    const data = await fs.readFile(filePath);

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new Response("Not found", { status: 404 });
    }

    throw error;
  }
}
