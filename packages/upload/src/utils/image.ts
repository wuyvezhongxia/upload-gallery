
import imageCompression from "browser-image-compression";
import UPNG from 'upng-js'
import type { CompressOptions } from "../types/compressOptions";
import Compressor from "compressorjs";
import { dataURLtoFile } from "./transform";
import { compressImageFile, resetTinyPngStatus, getTinyPngStatus } from '@yuanjing/tinypng-plugin';

// 智能压缩函数 - 优先使用 TinyPNG，失败时回退到本地压缩
async function compressImage(file: File, ops: CompressOptions = {}): Promise<File> {
    const { noCompressIfLarger = true,useTinyPng } = ops;
    
    // 如果启用 TinyPNG
    if (useTinyPng) {
        try {
            // 修正：使用正确的 API 参数格式
            const compressedFile = await compressImageFile(file, {
                proxyUrl: import.meta.env.VITE_TINYPNG_PROXY_URL || 'http://localhost:3001/api/tinypng/compress',
                maxFileSize: 10 * 1024 * 1024,
                enableCache: true
            });
            
            console.log(`✅ TinyPNG 压缩成功: ${file.size} → ${compressedFile.size} bytes`);
            
            if (!noCompressIfLarger || file.size > compressedFile.size) {
                return compressedFile;
            }
        } catch (error: any) {
            console.warn('TinyPNG 压缩失败，使用本地压缩:', error.message);
            
            // 如果是配额用完，记录状态
            if (error.message === 'QUOTA_EXHAUSTED') {
                console.warn('🚫 TinyPNG 配额已用完，切换到本地压缩');
            }
        }
    }
    
    // 本地压缩逻辑
    return await localCompress(file, ops);
}

// 本地压缩函数
async function localCompress(file: File, ops: CompressOptions = {}): Promise<File> {
    const { noCompressIfLarger = true, quality = 80, width, height } = ops;
    
    const isPng = await isPNG(file);
    const isJpg = await isJPG(file);
    let newFile: File | null = null;

    if (isPng) {
        try {
            const arrayBuffer = await getBlobArrayBuffer(file);
            const decoded = UPNG.decode(arrayBuffer);
            const rgba8 = UPNG.toRGBA8(decoded);
            
            const targetWidth = width || decoded.width;
            const targetHeight = height || decoded.height;
            
            let finalRgba8 = rgba8;
            if (width || height) {
                finalRgba8 = resizeImageData(rgba8, decoded.width, decoded.height, targetWidth, targetHeight);
            }
            
            // UPNG 质量参数：0表示无损，值越大压缩越多
            const pngQuality = quality >= 100 ? 0 : Math.floor((100 - quality) * 2.56);
            
            const compressed = UPNG.encode([finalRgba8], targetWidth, targetHeight, pngQuality);
            newFile = new File([compressed], file.name, { type: 'image/png' });
        } catch (error) {
            console.error('PNG压缩失败:', error);
            newFile = await fallbackPngCompression(file, ops);
        }
    }

    if (isJpg) {
        const compressed = await compressJPGImage(file, 'browser-image-compression', ops);
        newFile = new File([compressed], file.name, { type: "image/jpeg" });
    }
    
    if (!newFile) {
        return file;
    }
    
    if (!noCompressIfLarger) {
        return newFile;
    }
    
    console.log('本地压缩结果:', {
        original: file.size,
        compressed: newFile.size,
        ratio: `${((newFile.size / file.size) * 100).toFixed(1)}%`
    });
    
    return file.size > newFile.size ? newFile : file;
}

// 图像数据调整大小的辅助函数
function resizeImageData(imageData: Uint8Array[], originalWidth: number, originalHeight: number, targetWidth: number, targetHeight: number): Uint8Array[] {
    if (originalWidth === targetWidth && originalHeight === targetHeight) {
        return imageData;
    }
    // 简化实现：实际项目中建议使用专业的图像处理库
    return imageData;
}

// PNG压缩失败时的备用方案
async function fallbackPngCompression(file: File, ops: CompressOptions): Promise<File> {
    try {
        const { width, height } = ops;
        
        return new Promise<File>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const targetWidth = width || img.width;
                const targetHeight = height || img.height;
                
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('无法获取canvas上下文'));
                    return;
                }
                
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name, { type: 'image/png' }));
                    } else {
                        reject(new Error('Canvas转换失败'));
                    }
                }, 'image/png');
            };
            
            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = URL.createObjectURL(file);
        });
    } catch (error) {
        console.error('备用PNG压缩也失败了:', error);
        return file;
    }
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
    
    // 修正：maxSizeMB 计算公式
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
export const smartCompress = compressImage; // 智能压缩（TinyPNG + 本地）
export const localCompressOnly = localCompress; // 仅本地压缩
export { compressImage }; // 兼容旧版本

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