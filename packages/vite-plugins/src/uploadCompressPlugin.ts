import type { Plugin } from "vite";
import axios from "axios";
import pLimit from "p-limit";

// 前端压缩插件配置接口
export interface FrontendCompressPluginOptions {
  apiKey?: string; // 可选，支持运行时配置
  enableTinyPng?: boolean;
  enableLocalCompress?: boolean;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxFileSize?: number;
  concurrency?: number;
  enableCache?: boolean;
  autoInject?: boolean; // 是否自动注入压缩功能
}

// 客户端压缩选项接口
export interface ClientCompressOptions {
  apiKey?: string;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxFileSize?: number;
  enableCache?: boolean;
  preferTinyPng?: boolean; // 优先使用 TinyPNG
  fallbackToLocal?: boolean; // TinyPNG 失败时回退到本地
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
    // 每小时重置一次状态，给 TinyPNG 一个重试机会
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
    console.warn('🚫 TinyPNG 配额已用完，后续将使用本地压缩');
  }

  reset(): void {
    this.quotaExhausted = false;
    this.lastQuotaCheck = 0;
  }
}

// 内存缓存
const compressionCache = new Map<string, ArrayBuffer>();
const tinyPngStatus = TinyPngStatus.getInstance();

// TinyPNG 压缩函数（带错误检测）
export async function compressWithTinyPng(buffer: ArrayBuffer, apiKey: string): Promise<ArrayBuffer> {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.tinify.com/shrink',
      auth: {
        username: 'api',
        password: apiKey
      },
      data: buffer,
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      timeout: 30000
    });

    const compressedResponse = await axios({
      method: 'get',
      url: response.data.output.url,
      responseType: 'arraybuffer',
      timeout: 30000
    });

    return compressedResponse.data;
  } catch (error: any) {
    // 检查是否是配额用完的错误
    if (error.response?.status === 429 || 
        error.response?.data?.error === 'TooManyRequests' ||
        error.message?.includes('quota') ||
        error.message?.includes('limit')) {
      tinyPngStatus.markQuotaExhausted();
      throw new Error('QUOTA_EXHAUSTED');
    }
    throw error;
  }
}

// 本地 Canvas 压缩函数
export async function compressWithCanvas(
  file: File, 
  options: { quality?: number; maxWidth?: number; maxHeight?: number }
): Promise<File> {
  const { quality = 0.8, maxWidth = 1920, maxHeight = 1080 } = options;
  
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // 计算新尺寸
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制并压缩
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

// 智能压缩函数 - 优先 TinyPNG，失败时回退本地
export async function compressImageFile(
  file: File, 
  options: ClientCompressOptions = {}
): Promise<File> {
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

  // 检查文件大小
  if (file.size > maxFileSize) {
    console.warn(`文件大小超过限制: ${file.size} > ${maxFileSize}`);
    return file;
  }

  // 检查是否为支持的图片类型
  if (!isSupportedImageType(file.type)) {
    console.warn(`不支持的文件类型: ${file.type}`);
    return file;
  }

  let compressedFile = file;
  const originalSize = file.size;
  
  try {
    // 策略1: 优先尝试 TinyPNG 压缩
    if (preferTinyPng && apiKey && !tinyPngStatus.isQuotaExhausted()) {
      try {
        console.log('🎯 优先使用 TinyPNG 压缩...');
        
        const buffer = await file.arrayBuffer();
        
        // 检查缓存
        const cacheKey = generateCacheKey(new Uint8Array(buffer));
        if (enableCache && compressionCache.has(cacheKey)) {
          console.log('✅ 使用缓存的 TinyPNG 压缩结果');
          const cachedBuffer = compressionCache.get(cacheKey)!;
          compressedFile = new File([cachedBuffer], file.name, { type: file.type });
        } else {
          const compressedBuffer = await compressWithTinyPng(buffer, apiKey);
          
          // 缓存结果
          if (enableCache) {
            compressionCache.set(cacheKey, compressedBuffer);
          }
          
          compressedFile = new File([compressedBuffer], file.name, { type: file.type });
        }
        
        const tinyRatio = compressedFile.size / originalSize;
        console.log(
          `✅ TinyPNG 压缩成功: ${originalSize} → ${compressedFile.size} bytes ` +
          `(${(tinyRatio * 100).toFixed(1)}%)`
        );
        
        return compressedFile;
      } catch (error: any) {
        if (error.message === 'QUOTA_EXHAUSTED') {
          console.warn('⚠️ TinyPNG 配额已用完，回退到本地压缩');
        } else {
          console.warn('⚠️ TinyPNG 压缩失败，回退到本地压缩:', error.message);
        }
        
        // 继续执行本地压缩回退逻辑
      }
    }
    
    // 策略2: 回退到本地压缩
    if (fallbackToLocal) {
      console.log('🔄 使用本地压缩...');
      compressedFile = await compressWithCanvas(file, {
        quality,
        maxWidth,
        maxHeight
      });
      
      const localRatio = compressedFile.size / originalSize;
      console.log(
        `✅ 本地压缩完成: ${originalSize} → ${compressedFile.size} bytes ` +
        `(${(localRatio * 100).toFixed(1)}%)`
      );
      
      return compressedFile;
    }
    
    // 如果都不启用，返回原文件
    console.log('ℹ️ 未启用任何压缩方式，返回原文件');
    return file;
    
  } catch (error: any) {
    console.error('❌ 图片压缩失败:', error.message);
    return file;
  }
}

// 生成缓存键 - 修改为完全浏览器兼容的版本
function generateCacheKey(buffer: Uint8Array): string {
  // 使用简单的哈希算法生成缓存键
  let hash = 0;
  const str = Array.from(buffer.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
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

// 重置 TinyPNG 状态的工具函数（用于测试或手动重置）
export function resetTinyPngStatus(): void {
  tinyPngStatus.reset();
  console.log('🔄 TinyPNG 状态已重置');
}

// 检查 TinyPNG 状态的工具函数
export function getTinyPngStatus(): { quotaExhausted: boolean } {
  return {
    quotaExhausted: tinyPngStatus.isQuotaExhausted()
  };
}

// 前端压缩插件
export function frontendCompressPlugin(options: any = {}): Plugin {
  return {
    name: 'vite:frontend-compress',
    apply: 'build',
    
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

// 向后兼容
export function uploadCompressPlugin(options: any): Plugin {
  console.warn('uploadCompressPlugin 已废弃，请使用 frontendCompressPlugin');
  return frontendCompressPlugin(options);
}