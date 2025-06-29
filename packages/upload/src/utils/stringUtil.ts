import SparkMD5 from 'spark-md5'
import { message } from 'antd'
import dayjs from 'dayjs'

// base64转换
export function base64(s: string){
    return window.btoa(encodeURIComponent(s));
}

// 日期格式化
export function fomatData(d:Date|number|string,fmt="YYYY-MM-DD HH:mm:ss"){
    const date = dayjs(d);

    if(!date.isValid){
        message.warning('日期无效')
        return d.toString()
    }

    return date.format(fmt)
}

// 后缀提取
export function getFileSuffix(str:string){
    const startIndex = str.lastIndexOf('.')
    return startIndex >= 0?str.slice(startIndex):''
}

//  文件 MD5 哈希计算
export function getFileMd5Hash(file: File) {
  // 大文件（如视频、压缩包）直接加载会导致浏览器内存溢出，分块读取可避免此问题
  // FileReader 的 readAsArrayBuffer 方法是 异步执行 的
  return new Promise((resolve, reject) => {
    const bolbSlice = File.prototype.slice;
    const chunkSize = 2097152;
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    function loadNext() {
      const start = currentChunk * chunkSize;
      const end =
        start + chunkSize >= file.size ? file.size : start + chunkSize;
      // 将 Blob 或 File 对象读取为二进制 ArrayBuffer。
      fileReader.readAsArrayBuffer(bolbSlice.call(file, start, end));
    }

    fileReader.onload = function (e) {
      spark.append(e?.target?.result as ArrayBuffer);
      currentChunk += 1;

      if (currentChunk < chunks) {
        loadNext();
      } else {
        // 对之前通过 append() 累积的所有数据块进行汇总计算
        const hashResult = spark.end();
        resolve(hashResult);
      }
    };

    fileReader.onerror = function () {
      reject(new Error("oops, something went wrong."));
    };

    loadNext();
  });
}
