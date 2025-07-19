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
  }
  reset() {
    this.quotaExhausted = false;
    this.lastQuotaCheck = 0;
  }
};
var compressionCache = /* @__PURE__ */ new Map();
var tinyPngStatus = TinyPngStatus.getInstance();
async function compressWithTinyPng(buffer, proxyUrl = "http://localhost:3001/api/tinypng/compress") {
  try {
    const response = await axios({
      method: "post",
      url: proxyUrl,
      data: buffer,
      headers: {
        "Content-Type": "application/octet-stream"
      },
      responseType: "arraybuffer",
      timeout: 9e4,
      // 增加到90秒
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(progressEvent.loaded * 100 / progressEvent.total);
        }
      }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 429 || error.response?.data?.error === "QUOTA_EXHAUSTED") {
      tinyPngStatus.markQuotaExhausted();
    }
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      throw new Error("TIMEOUT");
    }
    throw error;
  }
}
async function compressImageFile(file, options = {}) {
  const {
    proxyUrl = "http://localhost:3001/api/tinypng/compress",
    maxFileSize = 10 * 1024 * 1024,
    enableCache = true
  } = options;
  if (file.size > maxFileSize) {
    throw new Error(`\u6587\u4EF6\u5927\u5C0F\u8D85\u8FC7\u9650\u5236: ${file.size} > ${maxFileSize}`);
  }
  if (!isSupportedImageType(file.type)) {
    throw new Error(`\u4E0D\u652F\u6301\u7684\u6587\u4EF6\u7C7B\u578B: ${file.type}`);
  }
  if (tinyPngStatus.isQuotaExhausted()) {
    throw new Error("QUOTA_EXHAUSTED");
  }
  try {
    const buffer = await file.arrayBuffer();
    const cacheKey = generateCacheKey(new Uint8Array(buffer));
    if (enableCache && compressionCache.has(cacheKey)) {
      const cachedBuffer = compressionCache.get(cacheKey);
      return new File([cachedBuffer], file.name, { type: file.type });
    }
    const compressedBuffer = await compressWithTinyPng(buffer, proxyUrl);
    if (enableCache) {
      compressionCache.set(cacheKey, compressedBuffer);
    }
    const compressedFile = new File([compressedBuffer], file.name, { type: file.type });
    return compressedFile;
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error("QUOTA_EXHAUSTED");
    } else if (error.response?.status === 401) {
      throw new Error("INVALID_API_KEY");
    } else if (error.code === "ECONNABORTED") {
      throw new Error("TIMEOUT");
    } else {
      throw new Error(`TinyPNG_ERROR: ${error.message}`);
    }
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
}
function getTinyPngStatus() {
  return {
    quotaExhausted: tinyPngStatus.isQuotaExhausted()
  };
}
function frontendCompressPlugin(options = {}) {
  return {
    name: "vite:tinypng-compress",
    config(config) {
      if (!config.define) {
        config.define = {};
      }
      config.define.__TINYPNG_CONFIG__ = JSON.stringify({
        proxyUrl: "http://localhost:3001/api/tinypng/compress",
        ...options
      });
    }
  };
}
export {
  compressImageFile,
  compressWithTinyPng,
  frontendCompressPlugin,
  getTinyPngStatus,
  resetTinyPngStatus
};
