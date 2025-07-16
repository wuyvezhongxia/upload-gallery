import type { Plugin } from "vite";
import axios from "axios";
import { createHash } from "node:crypto";
import pLimit from "p-limit";

// 插件配置接口
export interface UploadCompressPluginOptions {
  apiKey: string;
  uploadPaths?: string[];
  concurrency?: number;
  enableCache?: boolean;
  quality?: number;
  maxFileSize?: number;
  fallbackToLocal?: boolean;
}

// 压缩结果接口
interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  method: 'tinypng' | 'local' | 'none';
}

// 内存缓存
const compressionCache = new Map<string, Buffer>();

// TinyPNG 压缩函数
async function compressWithTinyPng(buffer: Buffer, apiKey: string): Promise<Buffer> {
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

  return Buffer.from(compressedResponse.data);
}

// 本地压缩回退 (Node.js 环境)
async function fallbackCompress(buffer: Buffer, quality: number = 0.8): Promise<Buffer> {
  console.warn('本地压缩功能需要集成 sharp 库');
  return buffer;
}

// 生成缓存键
function generateCacheKey(buffer: Buffer): string {
  return createHash('md5').update(buffer).digest('hex');
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

// 主插件函数
export function uploadCompressPlugin(options: UploadCompressPluginOptions): Plugin {
  const {
    apiKey,
    uploadPaths = ['/api/upload', '/upload'],
    concurrency = 3,
    enableCache = true,
    quality = 0.8,
    maxFileSize = 10 * 1024 * 1024, // 10MB
    fallbackToLocal = true
  } = options;

  if (!apiKey) {
    throw new Error('TinyPNG API Key is required');
  }

  const limit = pLimit(concurrency);

  return {
    name: 'vite:upload-compress',
    apply: 'serve',
    
    configureServer(server) {
      console.log('启用上传压缩插件');
      
      server.middlewares.use(async (req, res, next) => {
        const isUploadPath = uploadPaths.some(path => 
          req.url?.startsWith(path)
        );
        
        if (!isUploadPath || req.method !== 'POST') {
          return next();
        }

        // 检查 Content-Type
        const contentType = req.headers['content-type'] || '';
        
        // 处理 multipart/form-data
        if (contentType.includes('multipart/form-data')) {
          return handleMultipartUpload(req, res, next, {
            apiKey,
            limit,
            enableCache,
            quality,
            maxFileSize,
            fallbackToLocal
          });
        }
        
        // 处理直接的图片上传
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

// 处理 multipart/form-data 上传
async function handleMultipartUpload(
  req: any,
  res: any,
  next: any,
  options: any
) {
  const chunks: Buffer[] = [];
  
  req.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });
  
  req.on('end', async () => {
    try {
      const buffer = Buffer.concat(chunks);
      const compressedBuffer = await compressImage(buffer, options);
      req.body = compressedBuffer;
      next();
    } catch (error) {
      console.error('图片压缩失败:', error);
      next();
    }
  });
}

// 处理直接图片上传
async function handleDirectImageUpload(
  req: any,
  res: any,
  next: any,
  options: any
) {
  const chunks: Buffer[] = [];
  
  req.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });
  
  req.on('end', async () => {
    try {
      const buffer = Buffer.concat(chunks);
      const compressedBuffer = await compressImage(buffer, options);
      
      // 替换请求体
      req.body = compressedBuffer;
      
      // 更新 Content-Length
      req.headers['content-length'] = compressedBuffer.length.toString();
      
      next();
    } catch (error) {
      console.error('图片压缩失败:', error);
      next();
    }
  });
}

// 压缩图片的核心函数
async function compressImage(buffer: Buffer, options: any): Promise<Buffer> {
  const { apiKey, limit, enableCache, quality, maxFileSize, fallbackToLocal } = options;
  
  // 检查文件大小
  if (buffer.length > maxFileSize) {
    console.warn(`文件大小超过限制: ${buffer.length} > ${maxFileSize}`);
    return buffer;
  }
  
  // 检查缓存
  const cacheKey = generateCacheKey(buffer);
  if (enableCache && compressionCache.has(cacheKey)) {
    console.log('使用缓存的压缩结果');
    return compressionCache.get(cacheKey)!;
  }
  
  try {
    // 使用并发限制
    const compressedBuffer = await limit(async () => {
      return await compressWithTinyPng(buffer, apiKey);
    });
    
    // 缓存结果
    if (enableCache) {
      compressionCache.set(cacheKey, compressedBuffer);
    }
    
    const compressionRatio = compressedBuffer.length / buffer.length;
    console.log(
      `TinyPNG 压缩完成: ${buffer.length} → ${compressedBuffer.length} bytes ` +
      `(${(compressionRatio * 100).toFixed(1)}%)`
    );
    
    return compressedBuffer;
  } catch (error: any) {
    console.warn('TinyPNG 压缩失败:', error.message);
    
    // 尝试本地压缩回退
    if (fallbackToLocal) {
      try {
        const compressedBuffer = await fallbackCompress(buffer, quality);
        console.log('使用本地压缩回退');
        return compressedBuffer;
      } catch (localError) {
        console.warn('本地压缩也失败:', localError);
      }
    }
    
    // 压缩失败，返回原文件
    return buffer;
  }
}