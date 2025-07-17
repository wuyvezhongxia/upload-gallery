import * as qiniu from 'qiniu-js'
import {
    base64ToUrlSafe,
  computedHMAC_SHA256,
  urlSafeBase64Encode,
} from "./crypto";
import { getFileMd5Hash } from './stringUtil';
import type { QiNiuConfig } from '@yuanjing/shared';

// 上传进度变化时,注入自己的逻辑
async function uploadFile(file:File,qiniuOps:QiNiuConfig,options?:{
    process?:(percent:number)=>void
}){
  const { config, domain, token, scope, prefix } = qiniuOps;
  // 生成文件键
  const key = await generateNewFileKey(file, prefix, scope);
  return new Promise<string>((resolve, reject) => {
    const putExtra = {
      fname: key,
      customVars: {},
    };
    if (import.meta.env.VITE_APP_FAKE_UPLOAD) {
      let i = 0;
      const timer = setInterval(() => {
        if (i < 100) {
          options?.process?.(i);
          i += 10;
          return;
        }
        clearInterval(timer);
        // 返回的url地址为域名/文件键
        resolve(`${domain}/${putExtra.fname}`);
      }, 100);
      return;
    }
    const observable = qiniu.upload(
      file,
      putExtra.fname,
      token,
      putExtra,
      config
    );
    observable.subscribe({
      next(res) {
        const { percent } = res.total;
        options?.process?.(percent);
      },
      error(err) {
        reject(err);
      },
      complete() {
        resolve(`${domain}/${putExtra.fname}`);
      },
    });
  });
}

async function generateNewFileKey(file:File,prefix='mdImg', scope='sugar'){
  // 相同内容的文件会生成相同的哈希值，这就保证了相同内容的文件不会被重复存储
  const md5 = await getFileMd5Hash(file);
  return `${prefix}/${scope}/${md5}`;
}

async function generateQiniuToken(accessKey: string,secretKey:string,bucket:string,expires:number){
  const flags = {
    scope: bucket,
    deadline: expires,
  };
  // 七牛云要求上传策略必须以 URL-Safe Base64 格式传递，这样才能在 HTTP 请求中安全传输，不会被 URL 编码破坏。
  const encodeFlags = urlSafeBase64Encode(JSON.stringify(flags));
  const encoded = await computedHMAC_SHA256(secretKey, encodeFlags);
  const encodeSign = base64ToUrlSafe(encoded);
  const uploadToken = `${accessKey}:${encodeSign}:${encodeFlags}`;
  return uploadToken;
}

async function generateUploadToken(ops:{
    accessKey:string,
    secretKey:string,
    bucket:string,
    expires:number,
    domain:string,
    prefix:string,
    scope:string
}) {
    const {accessKey,secretKey,bucket,expires,domain,prefix,scope} = ops
    const token = await generateQiniuToken(accessKey,secretKey,bucket,Math.round(expires/1000))
    return btoa(
      JSON.stringify({
        token,
        date: expires,
        domain,
        prefix,
        scope,
        type: "qiniu",
      })
    );
}

export {
    uploadFile,
    generateNewFileKey,
    generateUploadToken
}