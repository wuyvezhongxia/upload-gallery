// src/uploadCompressPlugin.ts
import axios from "axios";
var TinyPngStatus = class _TinyPngStatus {
  static instance;
  quotaExhausted = false;
  lastQuotaCheck = 0;
  QUOTA_CHECK_INTERVAL = 60 * 60 * 1e3;
  // 1小时重置检查
  static getInstance() {
    if (!_TinyPngStatus.instance) {
      _TinyPngStatus.instance = new _TinyPngStatus();
    }
    return _TinyPngStatus.instance;
  }
  isQuotaExhausted() {
    const now = Date.now();
    if (now - this.lastQuotaCheck > this.QUOTA_CHECK_INTERVAL) {
      this.quotaExhausted = false;
      this.lastQuotaCheck = now;
    }
    return this.quotaExhausted;
  }
  markQuotaExhausted() {
    this.quotaExhausted = true;
    this.lastQuotaCheck = Date.now();
    console.warn("\u{1F6AB} TinyPNG \u914D\u989D\u5DF2\u7528\u5B8C\uFF0C\u540E\u7EED\u5C06\u4F7F\u7528\u672C\u5730\u538B\u7F29");
  }
  reset() {
    this.quotaExhausted = false;
    this.lastQuotaCheck = 0;
  }
};
var compressionCache = /* @__PURE__ */ new Map();
var tinyPngStatus = TinyPngStatus.getInstance();
async function compressWithTinyPng(buffer, apiKey) {
  try {
    const response = await axios({
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
    const compressedResponse = await axios({
      method: "get",
      url: response.data.output.url,
      responseType: "arraybuffer",
      timeout: 3e4
    });
    return compressedResponse.data;
  } catch (error) {
    if (error.response?.status === 429 || error.response?.data?.error === "TooManyRequests" || error.message?.includes("quota") || error.message?.includes("limit")) {
      tinyPngStatus.markQuotaExhausted();
      throw new Error("QUOTA_EXHAUSTED");
    }
    throw error;
  }
}
async function compressWithCanvas(file, options) {
  const { quality = 0.8, maxWidth = 1920, maxHeight = 1080 } = options;
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: file.type }));
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}
async function compressImageFile(file, options = {}) {
  const {
    apiKey,
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080,
    maxFileSize = 10 * 1024 * 1024,
    enableCache = true,
    preferTinyPng = true,
    fallbackToLocal = true
  } = options;
  if (file.size > maxFileSize) {
    console.warn(`\u6587\u4EF6\u5927\u5C0F\u8D85\u8FC7\u9650\u5236: ${file.size} > ${maxFileSize}`);
    return file;
  }
  if (!isSupportedImageType(file.type)) {
    console.warn(`\u4E0D\u652F\u6301\u7684\u6587\u4EF6\u7C7B\u578B: ${file.type}`);
    return file;
  }
  let compressedFile = file;
  const originalSize = file.size;
  try {
    if (preferTinyPng && apiKey && !tinyPngStatus.isQuotaExhausted()) {
      try {
        console.log("\u{1F3AF} \u4F18\u5148\u4F7F\u7528 TinyPNG \u538B\u7F29...");
        const buffer = await file.arrayBuffer();
        const cacheKey = generateCacheKey(new Uint8Array(buffer));
        if (enableCache && compressionCache.has(cacheKey)) {
          console.log("\u2705 \u4F7F\u7528\u7F13\u5B58\u7684 TinyPNG \u538B\u7F29\u7ED3\u679C");
          const cachedBuffer = compressionCache.get(cacheKey);
          compressedFile = new File([cachedBuffer], file.name, { type: file.type });
        } else {
          const compressedBuffer = await compressWithTinyPng(buffer, apiKey);
          if (enableCache) {
            compressionCache.set(cacheKey, compressedBuffer);
          }
          compressedFile = new File([compressedBuffer], file.name, { type: file.type });
        }
        const tinyRatio = compressedFile.size / originalSize;
        console.log(
          `\u2705 TinyPNG \u538B\u7F29\u6210\u529F: ${originalSize} \u2192 ${compressedFile.size} bytes (${(tinyRatio * 100).toFixed(1)}%)`
        );
        return compressedFile;
      } catch (error) {
        if (error.message === "QUOTA_EXHAUSTED") {
          console.warn("\u26A0\uFE0F TinyPNG \u914D\u989D\u5DF2\u7528\u5B8C\uFF0C\u56DE\u9000\u5230\u672C\u5730\u538B\u7F29");
        } else {
          console.warn("\u26A0\uFE0F TinyPNG \u538B\u7F29\u5931\u8D25\uFF0C\u56DE\u9000\u5230\u672C\u5730\u538B\u7F29:", error.message);
        }
      }
    }
    if (fallbackToLocal) {
      console.log("\u{1F504} \u4F7F\u7528\u672C\u5730\u538B\u7F29...");
      compressedFile = await compressWithCanvas(file, {
        quality,
        maxWidth,
        maxHeight
      });
      const localRatio = compressedFile.size / originalSize;
      console.log(
        `\u2705 \u672C\u5730\u538B\u7F29\u5B8C\u6210: ${originalSize} \u2192 ${compressedFile.size} bytes (${(localRatio * 100).toFixed(1)}%)`
      );
      return compressedFile;
    }
    console.log("\u2139\uFE0F \u672A\u542F\u7528\u4EFB\u4F55\u538B\u7F29\u65B9\u5F0F\uFF0C\u8FD4\u56DE\u539F\u6587\u4EF6");
    return file;
  } catch (error) {
    console.error("\u274C \u56FE\u7247\u538B\u7F29\u5931\u8D25:", error.message);
    return file;
  }
}
function generateCacheKey(buffer) {
  let hash = 0;
  const str = Array.from(buffer.slice(0, 32)).map((b) => b.toString(16).padStart(2, "0")).join("");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
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
function resetTinyPngStatus() {
  tinyPngStatus.reset();
  console.log("\u{1F504} TinyPNG \u72B6\u6001\u5DF2\u91CD\u7F6E");
}
function getTinyPngStatus() {
  return {
    quotaExhausted: tinyPngStatus.isQuotaExhausted()
  };
}
function frontendCompressPlugin(options = {}) {
  return {
    name: "vite:frontend-compress",
    apply: "build",
    config(config) {
      if (!config.define) {
        config.define = {};
      }
      config.define.__COMPRESS_CONFIG__ = JSON.stringify({
        preferTinyPng: true,
        fallbackToLocal: true,
        ...options
      });
    }
  };
}
function uploadCompressPlugin(options) {
  console.warn("uploadCompressPlugin \u5DF2\u5E9F\u5F03\uFF0C\u8BF7\u4F7F\u7528 frontendCompressPlugin");
  return frontendCompressPlugin(options);
}
export {
  compressImageFile,
  compressWithCanvas,
  compressWithTinyPng,
  frontendCompressPlugin,
  getTinyPngStatus,
  resetTinyPngStatus,
  uploadCompressPlugin
};
