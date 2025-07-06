
// HMAC-SHA256密钥生成 ,为 HMAC 签名生成密钥（如 API 认证）
export const computedCryptoKeySHA1 =(secret:string)=>{
  // 将字符串转换为 UTF-8 编码的字节数组
  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(secret);
  // 使用Web Crypto API创建加密密钥对象，该函数返回一个 Promise，解析为一个CryptoKey对象，用于后续的 HMAC 签名操作。
  return window.crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "HMAC", hash: { name: "SHA-1" } },
    false,
    ["sign",'verify'] 
  );
}

// ArrayBuffer与Base64转换
export function arrayBufferToBase64(buffer:ArrayBuffer) {
    // 字节数组
    const unit8Array = new Uint8Array(buffer)
    // Unicode字符
    const base64String = String.fromCharCode(...unit8Array)
    // Base64编码
    return btoa(base64String)
}

export function unit8ArrayToHex(unit8Array:Uint8Array):string {
    return Array.from(unit8Array)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

export async function computedHMAC_SHA256(secret:string,value:string,resultType:'hex'|'base64'='base64'){
    const encoder = new TextEncoder();
    const key = await computedCryptoKeySHA1(secret)
    const data = encoder.encode(value)
    const hashBuffer = await window.crypto.subtle.sign({name:'HMAC',hash:'SHA-256'},key,data)
    return resultType === 'base64'?arrayBufferToBase64(hashBuffer):unit8ArrayToHex(new Uint8Array(hashBuffer))
}

// 标准 Base64 → URL 安全的 Base64
export function base64ToUrlSafe(v:string){
    return v.replace(/\+/g, '-').replace(/\//g, '_');
}
// 将 URL 安全的 Base64 字符串还原为标准格式
export function urlSafeToBase64(v:string){
    return v.replace(/-/g, '+').replace(/_/g, '/');
}

export function urlSafeBase64Encode(str:string){
   const base64 = btoa(str);
   return base64ToUrlSafe(base64);
}