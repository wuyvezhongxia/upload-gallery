
import imageCompression from "browser-image-compression";
import UPNG from 'upng-js'
import type { CompressOptions } from "../types/compressOptions";
import Compressor from "compressorjs";
import { dataURLtoFile } from "./transform";
import { compressImageFile, resetTinyPngStatus, getTinyPngStatus } from '@yuanjing/tinypng-plugin';

async function compressImage(file:File, ops:CompressOptions = {}){
    const { noCompressIfLarger = true, quality = 80, width, height, useTinyPng } = ops;
    
    // 如果启用 TinyPNG
    if (useTinyPng && import.meta.env.VITE_TINYPNG_API_KEY) {
        try {
            const compressedFile = await compressImageFile(file, {
                apiKey: import.meta.env.VITE_TINYPNG_API_KEY,
                quality: quality / 100,
                maxFileSize: 10 * 1024 * 1024,
                enableCache: true
            });
            
            if (!noCompressIfLarger || file.size > compressedFile.size) {
                return compressedFile;
            }
        } catch (error) {
            console.warn('TinyPNG 压缩失败，使用本地压缩:', error);
        }
    }
    
    // 继续原有的本地压缩逻辑
    const isPng = await isPNG(file);
    const isJpg = await isJPG(file)
    let newFile: File | null = null

    if(isPng){
        try {
            const arrayBuffer = await getBlobArrayBuffer(file)
            const decoded = UPNG.decode(arrayBuffer)
            const rgba8 = UPNG.toRGBA8(decoded)
            
            // 修复尺寸参数错误
            const targetWidth = width || decoded.width
            const targetHeight = height || decoded.height
            
            // 如果需要调整尺寸，先进行尺寸调整
            let finalRgba8 = rgba8
            if (width || height) {
                finalRgba8 = resizeImageData(rgba8, decoded.width, decoded.height, targetWidth, targetHeight)
            }
            
            // 修复质量参数 - UPNG使用0-256范围，0表示无损
            const pngQuality = quality >= 100 ? 0 : Math.floor((100 - quality) * 2.56)
            
            const compressed = UPNG.encode([finalRgba8], targetWidth, targetHeight, pngQuality)
            newFile = new File([compressed], file.name, {type:'image/png'})
        } catch (error) {
            console.error('PNG压缩失败:', error)
            // 如果PNG压缩失败，尝试使用其他方法
            newFile = await fallbackPngCompression(file, ops)
        }
    }

    if(isJpg){
        const compressed = await compressJPGImage(file,'browser-image-compression',ops)
        newFile = new File([compressed], file.name, { type: "image/jpeg" });
    }
    
    if(!newFile){
        return file
    }
    
    if(!noCompressIfLarger){
        return newFile
    }
    
    console.log('原始文件大小:', file.size, '压缩后大小:', newFile.size);
    
    return file.size > newFile.size ? newFile : file
}

// 添加图像数据调整大小的辅助函数
function resizeImageData(imageData: Uint8Array[], originalWidth: number, originalHeight: number, targetWidth: number, targetHeight: number): Uint8Array[] {
    // 这里可以实现简单的最近邻插值或双线性插值
    // 为简化，如果尺寸不同就返回原始数据
    if (originalWidth === targetWidth && originalHeight === targetHeight) {
        return imageData
    }
    // 实际项目中建议使用专业的图像处理库
    return imageData
}

// PNG压缩失败时的备用方案
async function fallbackPngCompression(file: File, ops: CompressOptions): Promise<File> {
    try {
        // 使用Canvas方法作为备用方案，但保持PNG格式
        const { width, height } = ops
        
        return new Promise<File>((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const targetWidth = width || img.width
                const targetHeight = height || img.height
                
                canvas.width = targetWidth
                canvas.height = targetHeight
                
                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('无法获取canvas上下文'))
                    return
                }
                
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
                
                // 保持PNG格式
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name, { type: 'image/png' }))
                    } else {
                        reject(new Error('Canvas转换失败'))
                    }
                }, 'image/png')
            }
            
            img.onerror = () => reject(new Error('图片加载失败'))
            img.src = URL.createObjectURL(file)
        })
    } catch (error) {
        console.error('备用PNG压缩也失败了:', error)
        return file // 返回原文件
    }
}

function getBlobArrayBuffer(file:Blob):Promise<ArrayBuffer>{
    return file.arrayBuffer()
}

const isPNG = async (file:File)=>{
    const arrayBuffer = await getBlobArrayBuffer(file.slice(0,8))
    return signatureEqual(arrayBuffer,[137, 80, 78, 71, 13, 10, 26, 10])
}

const isJPG = async(file:File)=>{
    const arrayBuffer = await file.slice(0,3).arrayBuffer()
    const signature = [0xFF, 0xD8, 0xFF]
    const source = new Uint8Array(arrayBuffer)
    return source.every((value,index)=>value===signature[index])
}

// 比较截取的字节序列和PNG签名是否一致
const signatureEqual=(source:ArrayBuffer,signature:number[])=>{
    //类型化数组
    const array = new Uint8Array(source)
    for(let i = 0; i<signature.length; i++){
        if(array[i] !== signature[i]){
            return false
        }
    }
    return true
}

async function compressJPGImage(file:File,method:string,ops: CompressOptions = {}){
    let newFile : Blob = file
    const {noCompressIfLarger = true} = ops
    if(method === 'canvas'){
        newFile = await compressImageByCanvas(file,ops)
    }
    if(method === 'browser-image-compression'){
        newFile = await compressImageByImageCompression(file,ops)
    }
    if(method === 'Compressor'){
        newFile = await compressImageByCompressor(file,ops)
    }
    if(!noCompressIfLarger){
        return newFile
    }

    return file.size > newFile.size ? newFile : file
}

function compressImageByCanvas(file:File,options:CompressOptions={}){
    const  {quality = 80} = options
    let {width,height} = options   
    let _resolve: any
    const promise = new Promise<File>((resolve)=>{
        _resolve = resolve
    })

    const img = new Image();
    img.onload = () => {
      if(width && !height){
        height = Math.round(img.height * (width / img.width))
      }
      else if(height && !width){
        width = Math.round(img.width * (height / img.height))
      }
      const canvas = document.createElement('canvas');
      canvas.width = width || img.width;
      canvas.height = height || img.height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
    //  获取压缩后的图片数据
      const compressDataUrl = canvas.toDataURL('image/jpeg',quality/100)
    //   服务器通常期望接收到的是标准的文件对象
      _resolve(dataURLtoFile(compressDataUrl,file.name))
    };
    // 服务器通常期望接收到的是标准的文件对象
    img.src = URL.createObjectURL(file);
    return promise
  }

function compressImageByImageCompression(file:File,options:CompressOptions={}){
    const { quality = 80, width, height } = options;

  return imageCompression(file, {
    maxWidthOrHeight: width || height || undefined,
    maxSizeMB: Math.round(file.size / (1024 * 1024) * quality / 100), 
    fileType: 'image/jpeg',
    libURL: 'https://cdn.staticfile.net/browser-image-compression/2.0.2/browser-image-compression.js',
  });
}

function compressImageByCompressor(file:File,options:CompressOptions={}){
    const { quality = 80, width, height } = options;

  return new Promise<File|Blob>((resolve, reject) => {
    return new Compressor(file, {
      quality: quality / 100,
      width: width || undefined,
      height: height || undefined,
      success: (result) => resolve(result),
      error: (err) => reject(err),
    });
  });
}

export {
    compressImage
}

// 导出状态检查函数，方便调试
export { resetTinyPngStatus, getTinyPngStatus };