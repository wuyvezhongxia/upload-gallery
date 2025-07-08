// 把dataUrl转化成file对象
export function dataURLtoFile(dataURL:string,fileName:string){
    try{
        if(typeof dataURL !== 'string' || !dataURL.startsWith('data:')){
            throw new Error('无效的DataUrl格式')
        }
        // 可以使用 Blob 对象替代 File 对象，二者功能类似，只是 Blob 没有文件名属性
        console.log('dataURIIIIIIIIIIIIIIIIII',dataURL,fileName);  
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