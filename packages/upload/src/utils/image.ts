
import imageCompression from "browser-image-compression";
import UPNG from 'upng-js'
import type { CompressOptions } from "../types/compressOptions";
import Compressor from "compressorjs";
import { dataURLtoFile, calculateCompressionPercentage, formatSize } from "./transform";
import { compressImageFile, resetTinyPngStatus, getTinyPngStatus } from '@yuanjing/tinypng-plugin';

// 扩展压缩选项接口，添加进度回调
interface ExtendedCompressOptions extends CompressOptions {
    onProgress?: (percent: number, info?: string) => void;
}

// 智能压缩函数 - 优先使用 TinyPNG，失败时回退到本地压缩
async function compressImage(file: File, ops: ExtendedCompressOptions = {}): Promise<File> {
    const { noCompressIfLarger = true, useTinyPng, onProgress } = ops;
    
    // 如果启用 TinyPNG
    if (useTinyPng) {
        try {
            onProgress?.(10, 'TinyPNG 压缩开始...');
            
            let currentProgress = 10;
            const progressInterval = setInterval(() => {
                if (currentProgress < 80) {
                    currentProgress += Math.random() * 5 + 2;
                    currentProgress = Math.min(currentProgress, 80);
                    onProgress?.(Math.floor(currentProgress), 'TinyPNG 压缩中...');
                }
            }, 300); 
            
            const compressedFile = await compressImageFile(file, {
                proxyUrl: import.meta.env.VITE_TINYPNG_PROXY_URL || 'http://localhost:3001/api/tinypng/compress',
                maxFileSize: 10 * 1024 * 1024,
                enableCache: true
            });
            
            clearInterval(progressInterval);
            
            // 计算压缩率
            const compressionRate = calculateCompressionPercentage(file.size, compressedFile.size);
            const originalSizeStr = formatSize(file.size);
            const compressedSizeStr = formatSize(compressedFile.size);
            
            console.log(`✅ TinyPNG 压缩成功: ${file.size} → ${compressedFile.size} bytes`);
            console.log(`📊 压缩率: ${compressionRate}% (${originalSizeStr} → ${compressedSizeStr})`);
            
            onProgress?.(100, `TinyPNG 压缩完成！压缩率: ${compressionRate}%`);
            
            if (!noCompressIfLarger || file.size > compressedFile.size) {
                return compressedFile;
            }
        } catch (error: any) {
            onProgress?.(0, 'TinyPNG 压缩失败，切换到本地压缩...');
            
            // 如果是配额用完，记录状态
            if (error.message === 'QUOTA_EXHAUSTED') {
                console.warn('🚫 TinyPNG 配额已用完，切换到本地压缩');
                onProgress?.(0, 'TinyPNG 配额已用完，使用本地压缩...');
            }
        }
    }
    
    // 本地压缩逻辑
    onProgress?.(10, '开始本地压缩...');
    const result = await localCompress(file, { ...ops, onProgress });
    
    // 计算本地压缩率
    if (result !== file) {
        const compressionRate = calculateCompressionPercentage(file.size, result.size);
        onProgress?.(100, `本地压缩完成！压缩率: ${compressionRate}%`);
    } else {
        onProgress?.(100, '文件无需压缩');
    }
    
    return result;
}

// 本地压缩函数
async function localCompress(file: File, ops: ExtendedCompressOptions = {}): Promise<File> {
    const { noCompressIfLarger = true, quality = 80, width, height, onProgress } = ops;
    
    const isPng = await isPNG(file);
    const isJpg = await isJPG(file);
    let newFile: File | null = null;

    if (isPng) {
        onProgress?.(30, '处理 PNG 图片...');
        const arrayBuffer = await getBlobArrayBuffer(file)
        const decoded = UPNG.decode(arrayBuffer)
        const rgba8 = UPNG.toRGBA8(decoded)
        onProgress?.(60, '压缩 PNG 图片...');
        const compressed = UPNG.encode(rgba8, width || decoded.width, height || decoded.height, convertQualityToBit(quality))
        newFile = new File([compressed], file.name, { type: 'image/png' })
        onProgress?.(90, 'PNG 压缩完成');
    }

    if (isJpg) {
        onProgress?.(30, '处理 JPG 图片...');
        const compressed = await compressJPGImage(file, 'browser-image-compression', ops);
        newFile = new File([compressed], file.name, { type: "image/jpeg" });
        onProgress?.(90, 'JPG 压缩完成');
    }
    
    if (!newFile) {
        onProgress?.(100, '文件格式不支持压缩');
        return file;
    }
    
    if (!noCompressIfLarger) {
        return newFile;
    }
    
    const compressionRate = calculateCompressionPercentage(file.size, newFile.size);
    console.log('本地压缩结果:', {
        original: file.size,
        compressed: newFile.size,
        ratio: `${compressionRate}%`
    });
    
    return file.size > newFile.size ? newFile : file;
}

function getBlobArrayBuffer(file: Blob): Promise<ArrayBuffer> {
    return file.arrayBuffer();
}

const isPNG = async (file: File) => {
    const arrayBuffer = await getBlobArrayBuffer(file.slice(0, 8));
    return signatureEqual(arrayBuffer, [137, 80, 78, 71, 13, 10, 26, 10]);
};

const isJPG = async (file: File) => {
    const arrayBuffer = await file.slice(0, 3).arrayBuffer();
    const signature = [0xFF, 0xD8, 0xFF];
    const source = new Uint8Array(arrayBuffer);
    return source.every((value, index) => value === signature[index]);
};

function convertQualityToBit(quality: number): number {
  let bit = 0;
  if (quality > 100 || quality < 0) {
    bit = 0;
  } else {
    bit = !quality ? 0 : quality * 256 * 0.01;
  }
  return bit;
}

const signatureEqual = (source: ArrayBuffer, signature: number[]) => {
    const array = new Uint8Array(source);
    for (let i = 0; i < signature.length; i++) {
        if (array[i] !== signature[i]) {
            return false;
        }
    }
    return true;
};

async function compressJPGImage(file: File, method: string, ops: CompressOptions = {}) {
    let newFile: Blob = file;
    const { noCompressIfLarger = true } = ops;
    
    if (method === 'canvas') {
        newFile = await compressImageByCanvas(file, ops);
    }
    if (method === 'browser-image-compression') {
        newFile = await compressImageByImageCompression(file, ops);
    }
    if (method === 'Compressor') {
        newFile = await compressImageByCompressor(file, ops);
    }
    
    if (!noCompressIfLarger) {
        return newFile;
    }

    return file.size > newFile.size ? newFile : file;
}

function compressImageByCanvas(file: File, options: CompressOptions = {}): Promise<File> {
    const { quality = 80 } = options;
    let { width, height } = options;
    
    return new Promise<File>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            if (width && !height) {
                height = Math.round(img.height * (width / img.width));
            } else if (height && !width) {
                width = Math.round(img.width * (height / img.height));
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width || img.width;
            canvas.height = height || img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('无法获取 canvas 上下文'));
                return;
            }
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const compressDataUrl = canvas.toDataURL('image/jpeg', quality / 100);
            const resultFile = dataURLtoFile(compressDataUrl, file.name);
            
            if (resultFile) {
                resolve(resultFile);
            } else {
                reject(new Error('文件转换失败'));
            }
        };
        
        img.onerror = () => {
            reject(new Error('图片加载失败'));
        };
        
        img.src = URL.createObjectURL(file);
    });
}

function compressImageByImageCompression(file: File, options: CompressOptions = {}) {
    const { quality = 80, width, height } = options;
    const maxSizeMB = (file.size / (1024 * 1024)) * (quality / 100);
    return imageCompression(file, {
        maxWidthOrHeight: width || height || undefined,
        maxSizeMB: Math.max(0.1, maxSizeMB), // 确保最小值为 0.1MB
        fileType: 'image/jpeg',
        libURL: 'https://cdn.staticfile.net/browser-image-compression/2.0.2/browser-image-compression.js',
    });
}

function compressImageByCompressor(file: File, options: CompressOptions = {}) {
    const { quality = 80, width, height } = options;

    return new Promise<File | Blob>((resolve, reject) => {
        return new Compressor(file, {
            quality: quality / 100,
            width: width || undefined,
            height: height || undefined,
            success: (result) => resolve(result),
            error: (err) => reject(err),
        });
    });
}

// 便捷函数导出
export const smartCompress = compressImage;
export const localCompressOnly = localCompress;
export { compressImage };

// TinyPNG 状态管理
export { getTinyPngStatus, resetTinyPngStatus };

// React Hook（可选）
export function useImageCompress() {
    return {
        compress: compressImage,
        smartCompress,
        localCompress,
        getTinyPngStatus,
        resetTinyPngStatus
    };
}