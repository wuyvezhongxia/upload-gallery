// 把dataUrl转化成file对象
export function dataURLtoFile(dataURL:string,fileName:string){
    try{
        if(typeof dataURL !== 'string' || !dataURL.startsWith('data:')){
            throw new Error('无效的DataUrl格式')
        }
        const [dataDescription,base64Data] = dataURL.split(',')

        if(!dataDescription || !base64Data){
            throw new Error('无法解析DataUrl')
        }

        const mimeTypeMatch = dataDescription.match(/:(.*?);/)
        const mimetype = mimeTypeMatch?.[1] || '';

        if(!mimetype){
            throw new Error('无法提取MIME类型')
        }

        const decodedData = atob(base64Data)
        const u8arr = new Uint8Array(decodedData.length)
        for(let i = 0; i < decodedData.length; i++){
            u8arr[i] = decodedData.charCodeAt(i)
        }
        return new File([u8arr],fileName,{type:mimetype})
    }catch(error){
        console.log('DataURL转换出错',error);
        return null   
    }

}

// 格式化文件大小，将字节转换为更易读的单位（KB,MB）
export function formatSize(
  size: number,
  pointLength?: number,
  units?: string[]
) {
  let unit: any; 
  units = units || ["B", "K", "M", "G", "TB"]; 

  while ((unit = units.shift()) && size > 1024) {
    size /= 1024; 
  }

  return (
    (unit === "B"
      ? size 
      : size.toFixed(pointLength === undefined ? 2 : pointLength)) 
      + unit
  );
}
// 为浏览器中的 Blob 对象创建一个临时 URL，主要用于预览或下载。
export function createObjectURL(file: Blob) {
  return URL.createObjectURL(file);
}

//计算压缩比例
export function calculateCompressionPercentage(
  originalSize: number,
  compressedSize: number
) {
  if (originalSize === 0) {
    return 0;
  }
  const percentageDecreased =
    ((originalSize - compressedSize) / originalSize) * 100;
  return percentageDecreased.toFixed(2); 
}