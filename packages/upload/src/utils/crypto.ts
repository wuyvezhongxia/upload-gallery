import { webcrypto } from "crypto";

// 获取正确的crypto对象
function getCrypto() {
  // 浏览器环境
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto.subtle;
  }
  
  // Node.js环境
  return webcrypto.subtle;
}
// HMAC-SHA256密钥生成
export const computedCryptoKeySHA1 = async (secret: string) => {
  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(secret);
  const subtle = getCrypto();

  return subtle.importKey(
    "raw",
    keyMaterial,
    { name: "HMAC", hash: { name: "SHA-1" } },
    false,
    ["sign", "verify"]
  );
};

// ArrayBuffer与Base64转换
export function arrayBufferToBase64(buffer: ArrayBuffer) {
  const unit8Array = new Uint8Array(buffer);
  const base64String = String.fromCharCode(...unit8Array);
  return btoa(base64String);
}

export function unit8ArrayToHex(unit8Array: Uint8Array): string {
  return Array.from(unit8Array)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function computedHMAC_SHA256(
  secret: string,
  value: string,
  resultType: "hex" | "base64" = "base64"
) {
  const encoder = new TextEncoder();
  const key = await computedCryptoKeySHA1(secret);
  const data = encoder.encode(value);
  const subtle = getCrypto();
  const hashBuffer = await subtle.sign(
    { name: "HMAC", hash: "SHA-256" },
    key,
    data
  );
  return resultType === "base64"
    ? arrayBufferToBase64(hashBuffer)
    : unit8ArrayToHex(new Uint8Array(hashBuffer));
}

// 标准 Base64 → URL 安全的 Base64
export function base64ToUrlSafe(v: string) {
  return v.replace(/\+/g, "-").replace(/\//g, "_");
}

// 将 URL 安全的 Base64 字符串还原为标准格式
export function urlSafeToBase64(v: string) {
  return v.replace(/-/g, "+").replace(/_/g, "/");
}

export function urlSafeBase64Encode(str: string) {
  const base64 = btoa(str);
  return base64ToUrlSafe(base64);
}
