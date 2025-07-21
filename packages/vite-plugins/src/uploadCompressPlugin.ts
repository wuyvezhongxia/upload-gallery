import type { Plugin } from "vite";
import axios from "axios";

// 默认代理URL
const DEFAULT_PROXY_URL = 'http://localhost:3001/api/tinypng/compress';

// 客户端压缩选项接口
export interface ClientCompressOptions {
  proxyUrl?: string;
  maxFileSize?: number;
  enableCache?: boolean;
}

// TinyPNG 状态管理
class TinyPngStatus {
  private static instance: TinyPngStatus;
  private quotaExhausted = false;
  private lastQuotaCheck = 0;
  private readonly QUOTA_CHECK_INTERVAL = 60 * 60 * 1000; // 1小时重置检查

  static getInstance(): TinyPngStatus {
    if (!TinyPngStatus.instance) {
      TinyPngStatus.instance = new TinyPngStatus();
    }
    return TinyPngStatus.instance;
  }

  isQuotaExhausted(): boolean {
    const now = Date.now();
    if (now - this.lastQuotaCheck > this.QUOTA_CHECK_INTERVAL) {
      this.quotaExhausted = false;
      this.lastQuotaCheck = now;
    }
    return this.quotaExhausted;
  }

  markQuotaExhausted(): void {
    this.quotaExhausted = true;
    this.lastQuotaCheck = Date.now();
  }

  reset(): void {
    this.quotaExhausted = false;
    this.lastQuotaCheck = 0;
  }
}

// 内存缓存
const compressionCache = new Map<string, ArrayBuffer>();
const tinyPngStatus = TinyPngStatus.getInstance();

// TinyPNG 压缩函数（通过代理服务器）
export async function compressWithTinyPng(
  buffer: ArrayBuffer, 
  proxyUrl: string = process.env.VITE_TINYPNG_PROXY_URL || DEFAULT_PROXY_URL
): Promise<ArrayBuffer> {
  try {
    const response = await axios({
      method: 'post',
      url: proxyUrl,
      data: buffer,
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      responseType: 'arraybuffer',
      timeout: 90000, // 增加到90秒
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        }
      }
    });

    return response.data;
  } catch (error: any) {
    // 检查是否是配额用完的错误
    if (error.response?.status === 429 || 
        error.response?.data?.error === 'QUOTA_EXHAUSTED') {
      tinyPngStatus.markQuotaExhausted();    }
    
    // 检查是否是超时错误
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('TIMEOUT');
    }
    throw error;
  }
}

// TinyPNG 压缩主函数
export async function compressImageFile(
  file: File, 
  options: ClientCompressOptions = {}
): Promise<File> {
  const {
    proxyUrl = process.env.VITE_TINYPNG_PROXY_URL || DEFAULT_PROXY_URL,
    maxFileSize = 10 * 1024 * 1024,
    enableCache = true
  } = options;

  // 检查文件大小
  if (file.size > maxFileSize) {
    throw new Error(`文件大小超过限制: ${file.size} > ${maxFileSize}`);
  }

  // 检查是否为支持的图片类型
  if (!isSupportedImageType(file.type)) {
    throw new Error(`不支持的文件类型: ${file.type}`);
  }

  // 检查配额状态
  if (tinyPngStatus.isQuotaExhausted()) {
    throw new Error('QUOTA_EXHAUSTED');
  }

  try {
    const buffer = await file.arrayBuffer();
    
    // 检查缓存
    const cacheKey = generateCacheKey(new Uint8Array(buffer));
    if (enableCache && compressionCache.has(cacheKey)) {
      const cachedBuffer = compressionCache.get(cacheKey)!;
      return new File([cachedBuffer], file.name, { type: file.type });
    }

    const compressedBuffer = await compressWithTinyPng(buffer, proxyUrl);
    
    // 缓存结果
    if (enableCache) {
      compressionCache.set(cacheKey, compressedBuffer);
    }
    
    const compressedFile = new File([compressedBuffer], file.name, { type: file.type })
    return compressedFile;
  } catch (error: any) {
    if (error.response?.status === 429) {
      throw new Error('QUOTA_EXHAUSTED');
    } else if (error.response?.status === 401) {
      throw new Error('INVALID_API_KEY');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('TIMEOUT');
    } else {
      throw new Error(`TinyPNG_ERROR: ${error.message}`);
    }
  }
}

// 生成缓存键
function generateCacheKey(buffer: Uint8Array): string {
  let hash = 0;
  const str = Array.from(buffer.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(16);
}

// 检查是否为支持的图片类型
function isSupportedImageType(contentType: string): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];
  return supportedTypes.includes(contentType);
}

// 重置状态
export function resetTinyPngStatus(): void {
  tinyPngStatus.reset();
}

// 获取状态
export function getTinyPngStatus(): { quotaExhausted: boolean } {
  return {
    quotaExhausted: tinyPngStatus.isQuotaExhausted()
  };
}

// 前端压缩插件
export function frontendCompressPlugin(options: any = {}): Plugin {
  return {
    name: 'vite:tinypng-compress',
    config(config, env) {
      if (!config.define) {
        config.define = {};
      }
      
      // 尝试从环境变量获取，否则使用默认值或传入的选项
      const proxyUrl = options.proxyUrl || process.env.VITE_TINYPNG_PROXY_URL || DEFAULT_PROXY_URL;
      
      config.define.__TINYPNG_CONFIG__ = JSON.stringify({
        proxyUrl,
        ...options
      });
    }
  };
}
