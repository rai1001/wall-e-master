import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

interface StoredAudio {
  fileName: string;
  url: string;
}

class VoiceAudioStore {
  private readonly outputDir?: string;

  constructor(outputDir?: string) {
    this.outputDir = outputDir;
  }

  saveMp3(buffer: Buffer, prefix = "tts"): StoredAudio {
    const fileName = `${prefix}_${randomUUID()}.mp3`;
    const outputPath = join(this.resolveOutputDir(), fileName);
    mkdirSync(this.resolveOutputDir(), { recursive: true });
    writeFileSync(outputPath, buffer);

    return {
      fileName,
      url: `/api/voice/output/${fileName}`
    };
  }

  readMp3(fileName: string): Buffer | null {
    if (!this.isSafeFileName(fileName) || !fileName.endsWith(".mp3")) {
      return null;
    }

    const outputPath = join(this.resolveOutputDir(), fileName);
    if (!existsSync(outputPath)) {
      return null;
    }

    try {
      return readFileSync(outputPath);
    } catch {
      return null;
    }
  }

  private resolveOutputDir(): string {
    if (this.outputDir?.trim()) {
      return this.outputDir;
    }

    const envDir = process.env.CLAWOS_VOICE_OUTPUT_DIR?.trim();
    if (envDir) {
      return envDir;
    }

    return join(process.cwd(), "workspace", "voice-output");
  }

  private isSafeFileName(fileName: string): boolean {
    return /^[a-zA-Z0-9._-]+$/.test(fileName);
  }
}

export { VoiceAudioStore };
