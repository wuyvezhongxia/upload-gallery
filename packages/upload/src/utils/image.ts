
import imageCompression from "browser-image-compression";
import UPNG from 'upng-js'
import type { CompressOptions } from "../types/compressOptions";
import Compressor from "compressorjs";
import { dataURLtoFile } from "./transform";

async function compressImage(file:File, ops:CompressOptions = {}){
    const { noCompressIfLarger = true, quality = 80, width, height } = ops;
    const isPng = await isPNG(file)
    const isJpg = await isJPG(file)
    let newFile: File | null = null

    if(isPng){
        const arrayBuffer = await getBlobArrayBuffer(file)
        const decoded = UPNG.decode(arrayBuffer)
        const rgba8 = UPNG.toRGBA8(decoded)
        const compressed = UPNG.encode(rgba8,width||decoded.height,height||decoded.height,convertQualityToBit(quality))
        newFile = new File([compressed],file.name,{type:'image/png'})
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
    console.log('newnewnnewFile',newFile);
    
    return file.size > newFile.size?newFile:file

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

// 将quality转换为特殊深度值
function convertQualityToBit(quality:number):number{
    let bit = 0
    if(quality > 100 || quality < 0){
        bit = 0
    }
    else{
        bit = !quality ? 0 : quality * 256 * 0.01
    }
    return bit
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