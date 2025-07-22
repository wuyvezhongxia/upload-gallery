import CryptoJS from "crypto-js";

// HMAC-SHA256密钥生成 - 使用CryptoJS实现
export const computedCryptoKeySHA1 = async (secret: string) => {
  // CryptoJS不需要显式生成密钥，直接在sign时使用
  return secret; // 返回密钥字符串即可，后续直接使用
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

export async function computedHMAC_SHA1(
  secret: string,
  value: string,
  resultType: "hex" | "base64" = "base64"
) {
  // 使用CryptoJS计算HMAC
  const hash = CryptoJS.HmacSHA1(value, secret);

  // 根据需要的结果类型返回
  if (resultType === "base64") {
    return CryptoJS.enc.Base64.stringify(hash);
  } else {
    return hash.toString(CryptoJS.enc.Hex);
  }
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
