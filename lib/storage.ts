import fs from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), ".data", "roasts");
const VIDEO_EXTENSION = ".mp4";
const META_EXTENSION = ".json";

type RoastMetadata = {
  script: string;
  caption: string;
  durationSec: number;
  videoUrl: string;
};

async function ensureStorageDir(): Promise<void> {
  await fs.mkdir(STORAGE_ROOT, { recursive: true });
}

function isValidChecksum(checksum: string): boolean {
  return /^[a-f0-9]{64}$/i.test(checksum);
}

function videoFileName(checksum: string): string {
  return `${checksum}${VIDEO_EXTENSION}`;
}

function metaFileName(checksum: string): string {
  return `${checksum}${META_EXTENSION}`;
}

function filePath(fileName: string): string {
  return path.join(STORAGE_ROOT, fileName);
}

async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

export async function saveMp4AndGetUrl(buffer: Buffer, checksum: string): Promise<string> {
  if (!isValidChecksum(checksum)) {
    throw new Error("Invalid checksum supplied.");
  }

  await ensureStorageDir();
  const file = filePath(videoFileName(checksum));

  if (!(await exists(file))) {
    await fs.writeFile(file, buffer);
  }

  // TODO: Swap for S3/GCS upload with presigned delivery URL in production.
  return `/roasts/${videoFileName(checksum)}`;
}

export async function readRoastMetadata(checksum: string): Promise<RoastMetadata | null> {
  if (!isValidChecksum(checksum)) {
    return null;
  }

  const metaPath = filePath(metaFileName(checksum));

  if (!(await exists(metaPath))) {
    return null;
  }

  const raw = await fs.readFile(metaPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "script" in parsed &&
    "caption" in parsed &&
    "durationSec" in parsed &&
    "videoUrl" in parsed
  ) {
    const candidate = parsed as Record<string, unknown>;

    if (
      typeof candidate.script === "string" &&
      typeof candidate.caption === "string" &&
      typeof candidate.durationSec === "number" &&
      typeof candidate.videoUrl === "string"
    ) {
      return {
        script: candidate.script,
        caption: candidate.caption,
        durationSec: candidate.durationSec,
        videoUrl: candidate.videoUrl
      };
    }
  }

  return null;
}

export async function writeRoastMetadata(checksum: string, metadata: RoastMetadata): Promise<void> {
  if (!isValidChecksum(checksum)) {
    throw new Error("Invalid checksum supplied.");
  }

  await ensureStorageDir();
  const metaPath = filePath(metaFileName(checksum));
  await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), "utf8");
}

export function getRoastFilePathFromName(fileName: string): string {
  const resolved = path.resolve(STORAGE_ROOT, fileName);
  const normalizedRoot = `${path.resolve(STORAGE_ROOT)}${path.sep}`;

  if (!resolved.startsWith(normalizedRoot)) {
    throw new Error("Invalid file path request.");
  }

  return resolved;
}
