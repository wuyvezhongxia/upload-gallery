// src/imageCompress.ts
import { readFile, writeFile, mkdir, access } from "fs/promises";
import axios from "axios";
import { createHash } from "crypto";
import { join, extname } from "path";
import pLimit from "p-limit";
var pathExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};
var ensureDir = async (dir) => {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }
};
var getImageMimeType = (filePath) => {
  const ext = extname(filePath).toLowerCase();
  const mimeMap = {
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
var TinyPngCompressor = class {
  cachePath;
  apiKey;
  enableCache;
  constructor(apiKey, cacheDir = "node_modules/.cache/vite-tinypng", enableCache = true) {
    this.apiKey = apiKey;
    this.cachePath = join(process.cwd(), cacheDir);
    this.enableCache = enableCache;
  }
  async compressImage(file, originalPath) {
    const hashname = createHash("md5").update(file).digest("hex");
    const ext = originalPath ? extname(originalPath) : ".jpg";
    const filePath = join(this.cachePath, hashname + ext);
    if (this.enableCache && await pathExists(filePath)) {
      console.log(`Using cached image: ${originalPath || "image"}`);
      return await readFile(filePath);
    }
    try {
      if (this.enableCache) {
        await ensureDir(this.cachePath);
      }
      const response = await axios({
        method: "post",
        url: "https://api.tinify.com/shrink",
        auth: {
          username: "api",
          password: this.apiKey
        },
        data: file,
        headers: {
          "Content-Type": "application/octet-stream"
        }
      });
      const compressedResponse = await axios({
        method: "get",
        url: response.data.output.url,
        responseType: "arraybuffer"
      });
      const compressedBuffer = Buffer.from(compressedResponse.data);
      if (this.enableCache) {
        await writeFile(filePath, compressedBuffer);
      }
      console.log(
        `TinyPNG compressed: ${originalPath || "image"} (${file.length} \u2192 ${compressedBuffer.length} bytes)`
      );
      return compressedBuffer;
    } catch (error) {
      if (error.response?.status === 401) {
        console.error("TinyPNG API Key \u65E0\u6548\uFF0C\u8BF7\u68C0\u67E5\u4F60\u7684 API Key");
      } else if (error.response?.status === 429) {
        console.error("TinyPNG API \u914D\u989D\u5DF2\u7528\u5B8C");
      } else {
        console.warn("TinyPNG compression failed:", error.message);
      }
      return file;
    }
  }
};
function shouldProcessImage(id, include, exclude) {
  if (include instanceof RegExp) {
    if (!include.test(id)) return false;
  } else if (Array.isArray(include)) {
    if (!include.some((pattern) => id.endsWith(pattern))) return false;
  }
  if (exclude) {
    if (exclude instanceof RegExp) {
      if (exclude.test(id)) return false;
    } else if (Array.isArray(exclude)) {
      if (exclude.some((pattern) => id.endsWith(pattern))) return false;
    }
  }
  return true;
}
function tinyPngPlugin(options) {
  const {
    apiKey,
    include = /\.(png|jpe?g|gif|webp|avif|bmp|tiff?|svg)$/i,
    exclude,
    cacheDir = "node_modules/.cache/vite-tinypng",
    cache = true,
    inlineThreshold = 8192,
    // 8KB
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
    async generateBundle(options2, bundle) {
      const imageAssets = Object.keys(bundle).filter(
        (fileName) => shouldProcessImage(fileName, include, exclude)
      );
      await Promise.all(
        imageAssets.map(
          (fileName) => limit(async () => {
            const asset = bundle[fileName];
            if (asset && asset.type === "asset" && "source" in asset && asset.source) {
              try {
                const buffer = Buffer.isBuffer(asset.source) ? asset.source : Buffer.from(asset.source);
                const compressedBuffer = await compressor.compressImage(buffer, fileName);
                if (compressedBuffer.length < inlineThreshold) {
                  const mimeType = getImageMimeType(fileName);
                  const base64 = compressedBuffer.toString("base64");
                  asset.source = `data:${mimeType};base64,${base64}`;
                } else {
                  asset.source = compressedBuffer;
                }
              } catch (error) {
                console.warn(`Failed to compress image: ${fileName}`, error);
              }
            }
          })
        )
      );
    }
  };
}

// src/uploadCompressPlugin.ts
import axios2 from "axios";
import { createHash as createHash2 } from "crypto";
import pLimit2 from "p-limit";
var compressionCache = /* @__PURE__ */ new Map();
async function compressWithTinyPng(buffer, apiKey) {
  const response = await axios2({
    method: "post",
    url: "https://api.tinify.com/shrink",
    auth: {
      username: "api",
      password: apiKey
    },
    data: buffer,
    headers: {
      "Content-Type": "application/octet-stream"
    },
    timeout: 3e4
  });
  const compressedResponse = await axios2({
    method: "get",
    url: response.data.output.url,
    responseType: "arraybuffer",
    timeout: 3e4
  });
  return Buffer.from(compressedResponse.data);
}
async function fallbackCompress(buffer, quality = 0.8) {
  console.warn("\u672C\u5730\u538B\u7F29\u529F\u80FD\u9700\u8981\u96C6\u6210 sharp \u5E93");
  return buffer;
}
function generateCacheKey(buffer) {
  return createHash2("md5").update(buffer).digest("hex");
}
function isSupportedImageType(contentType) {
  const supportedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
  ];
  return supportedTypes.includes(contentType);
}
function uploadCompressPlugin(options) {
  const {
    apiKey,
    uploadPaths = ["/api/upload", "/upload"],
    concurrency = 3,
    enableCache = true,
    quality = 0.8,
    maxFileSize = 10 * 1024 * 1024,
    // 10MB
    fallbackToLocal = true
  } = options;
  if (!apiKey) {
    throw new Error("TinyPNG API Key is required");
  }
  const limit = pLimit2(concurrency);
  return {
    name: "vite:upload-compress",
    apply: "serve",
    // 只在开发服务器中生效
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const isUploadPath = uploadPaths.some(
          (path) => req.url?.startsWith(path)
        );
        if (!isUploadPath || req.method !== "POST") {
          return next();
        }
        const contentType = req.headers["content-type"] || "";
        if (contentType.includes("multipart/form-data")) {
          return handleMultipartUpload(req, res, next, {
            apiKey,
            limit,
            enableCache,
            quality,
            maxFileSize,
            fallbackToLocal
          });
        }
        if (isSupportedImageType(contentType)) {
          return handleDirectImageUpload(req, res, next, {
            apiKey,
            limit,
            enableCache,
            quality,
            maxFileSize,
            fallbackToLocal
          });
        }
        next();
      });
    }
  };
}
async function handleMultipartUpload(req, res, next, options) {
  const chunks = [];
  req.on("data", (chunk) => {
    chunks.push(chunk);
  });
  req.on("end", async () => {
    try {
      const buffer = Buffer.concat(chunks);
      const compressedBuffer = await compressImage(buffer, options);
      req.body = compressedBuffer;
      next();
    } catch (error) {
      console.error("\u56FE\u7247\u538B\u7F29\u5931\u8D25:", error);
      next();
    }
  });
}
async function handleDirectImageUpload(req, res, next, options) {
  const chunks = [];
  req.on("data", (chunk) => {
    chunks.push(chunk);
  });
  req.on("end", async () => {
    try {
      const buffer = Buffer.concat(chunks);
      const compressedBuffer = await compressImage(buffer, options);
      req.body = compressedBuffer;
      req.headers["content-length"] = compressedBuffer.length.toString();
      next();
    } catch (error) {
      console.error("\u56FE\u7247\u538B\u7F29\u5931\u8D25:", error);
      next();
    }
  });
}
async function compressImage(buffer, options) {
  const { apiKey, limit, enableCache, quality, maxFileSize, fallbackToLocal } = options;
  if (buffer.length > maxFileSize) {
    console.warn(`\u6587\u4EF6\u5927\u5C0F\u8D85\u8FC7\u9650\u5236: ${buffer.length} > ${maxFileSize}`);
    return buffer;
  }
  const cacheKey = generateCacheKey(buffer);
  if (enableCache && compressionCache.has(cacheKey)) {
    console.log("\u4F7F\u7528\u7F13\u5B58\u7684\u538B\u7F29\u7ED3\u679C");
    return compressionCache.get(cacheKey);
  }
  try {
    const compressedBuffer = await limit(async () => {
      return await compressWithTinyPng(buffer, apiKey);
    });
    if (enableCache) {
      compressionCache.set(cacheKey, compressedBuffer);
    }
    const compressionRatio = compressedBuffer.length / buffer.length;
    console.log(
      `TinyPNG \u538B\u7F29\u5B8C\u6210: ${buffer.length} \u2192 ${compressedBuffer.length} bytes (${(compressionRatio * 100).toFixed(1)}%)`
    );
    return compressedBuffer;
  } catch (error) {
    console.warn("TinyPNG \u538B\u7F29\u5931\u8D25:", error.message);
    if (fallbackToLocal) {
      try {
        const compressedBuffer = await fallbackCompress(buffer, quality);
        console.log("\u4F7F\u7528\u672C\u5730\u538B\u7F29\u56DE\u9000");
        return compressedBuffer;
      } catch (localError) {
        console.warn("\u672C\u5730\u538B\u7F29\u4E5F\u5931\u8D25:", localError);
      }
    }
    return buffer;
  }
}
export {
  TinyPngCompressor,
  tinyPngPlugin,
  uploadCompressPlugin
};
