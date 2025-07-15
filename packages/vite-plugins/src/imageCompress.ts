import type { Plugin } from "vite";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import axios from "axios";
import { createHash } from "node:crypto";
import { join, extname } from "node:path";
import pLimit from "p-limit";

// 插件配置接口
interface TinyPngPluginOptions {
  /**
   * TinyPNG API Key
   * @required
   */
  apiKey: string;
  /**
   * 包含的文件模式
   * @default /\.(png|jpe?g|gif|webp|avif|bmp|tiff?|svg)$/i
   */
  include?: RegExp | string[];
  /**
   * 排除的文件模式
   */
  exclude?: RegExp | string[];
  /**
   * 缓存目录
   * @default 'node_modules/.cache/vite-tinypng'
   */
  cacheDir?: string;
  /**
   * 是否启用缓存
   * @default true
   */
  cache?: boolean;
  /**
   * 内联阈值，小于此大小的图片转为 base64 内联
   * @default 8192 (8KB)
   */
  inlineThreshold?: number;
  /**
   * 并发限制
   * @default 5
   */
  concurrency?: number;
}

// 替换 fs-extra 的工具函数
const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const ensureDir = async (dir: string): Promise<void> => {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error: any) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }
};

// 获取图片MIME类型
const getImageMimeType = (filePath: string): string => {
  const ext = extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".svg": "image/svg+xml"
  };
  return mimeMap[ext] || "image/jpeg";
};

// TinyPNG 压缩器类（使用官方API）
class TinyPngCompressor {
  private cachePath: string;
  private apiKey: string;
  private enableCache: boolean;

  constructor(apiKey: string, cacheDir = "node_modules/.cache/vite-tinypng", enableCache = true) {
    this.apiKey = apiKey;
    this.cachePath = join(process.cwd(), cacheDir);
    this.enableCache = enableCache;
  }

  async compressImage(file: Buffer, originalPath?: string): Promise<Buffer> {
    const hashname = createHash("md5").update(file).digest("hex");
    const ext = originalPath ? extname(originalPath) : '.jpg';
    const filePath = join(this.cachePath, hashname + ext);

    // 检查缓存（只有启用缓存时才检查）
    if (this.enableCache && await pathExists(filePath)) {
      console.log(`Using cached image: ${originalPath || 'image'}`);
      return await readFile(filePath);
    }

    try {
      // 确保缓存目录存在（只有启用缓存时才创建）
      if (this.enableCache) {
        await ensureDir(this.cachePath);
      }

      // 使用官方 TinyPNG API
      const response = await axios({
        method: "post",
        url: "https://api.tinify.com/shrink",
        auth: {
          username: "api",
          password: this.apiKey,
        },
        data: file,
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      // 下载压缩后的图片
      const compressedResponse = await axios({
        method: "get",
        url: response.data.output.url,
        responseType: "arraybuffer",
      });

      const compressedBuffer = Buffer.from(compressedResponse.data);

      // 保存到缓存（只有启用缓存时才保存）
      if (this.enableCache) {
        await writeFile(filePath, compressedBuffer);
      }

      console.log(
        `TinyPNG compressed: ${originalPath || "image"} (${
          file.length
        } → ${
          compressedBuffer.length
        } bytes)`
      );

      return compressedBuffer;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error("TinyPNG API Key 无效，请检查你的 API Key");
      } else if (error.response?.status === 429) {
        console.error("TinyPNG API 配额已用完");
      } else {
        console.warn("TinyPNG compression failed:", error.message);
      }
      return file; // 失败时返回原文件
    }
  }
}

// 文件过滤工具函数
function shouldProcessImage(
  id: string,
  include: RegExp | string[],
  exclude?: RegExp | string[]
): boolean {
  // 检查包含规则
  if (include instanceof RegExp) {
    if (!include.test(id)) return false;
  } else if (Array.isArray(include)) {
    if (!include.some((pattern) => id.endsWith(pattern))) return false;
  }

  // 检查排除规则
  if (exclude) {
    if (exclude instanceof RegExp) {
      if (exclude.test(id)) return false;
    } else if (Array.isArray(exclude)) {
      if (exclude.some((pattern) => id.endsWith(pattern))) return false;
    }
  }

  return true;
}

// Vite 插件主函数
export function tinyPngPlugin(options: TinyPngPluginOptions): Plugin {
  const {
    apiKey,
    include = /\.(png|jpe?g|gif|webp|avif|bmp|tiff?|svg)$/i,
    exclude,
    cacheDir = "node_modules/.cache/vite-tinypng",
    cache = true,
    inlineThreshold = 8192, // 8KB
    concurrency = 5
  } = options;

  if (!apiKey) {
    throw new Error(
      "TinyPNG API Key is required. Get one from https://tinypng.com/developers"
    );
  }

  const compressor = new TinyPngCompressor(apiKey, cacheDir, cache);
  const limit = pLimit(concurrency);

  return {
    name: "vite:tinypng",
    apply: "build",

    async generateBundle(options, bundle) {
      // 获取所有图片资源
      const imageAssets = Object.keys(bundle).filter(fileName =>
        shouldProcessImage(fileName, include, exclude)
      );

      // 并发处理图片
      await Promise.all(
        imageAssets.map(fileName =>
          limit(async () => {
            const asset = bundle[fileName];
            // 添加类型检查，确保 asset 存在且为 OutputAsset 类型
            if (asset && asset.type === 'asset' && 'source' in asset && asset.source) {
              try {
                const buffer = Buffer.isBuffer(asset.source)
                  ? asset.source
                  : Buffer.from(asset.source);

                // 压缩图片
                const compressedBuffer = await compressor.compressImage(buffer, fileName);

                // 根据大小决定是否内联
                if (compressedBuffer.length < inlineThreshold) {
                  // 小图片转为 base64 内联
                  const mimeType = getImageMimeType(fileName);
                  const base64 = compressedBuffer.toString('base64');
                  asset.source = `data:${mimeType};base64,${base64}`;
                } else {
                  // 大图片保持二进制格式
                  asset.source = compressedBuffer;
                }
              } catch (error: any) {
                console.warn(`Failed to compress image: ${fileName}`, error);
              }
            }
          })
        )
      );
    },
  };
}

// 导出压缩器类，以便其他地方使用
export { TinyPngCompressor };