import dotenv from "dotenv";
import qiniu from "qiniu";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import clipboardy from "clipboardy";

// dotenv 会读取项目根目录或指定路径下的 .env 文件，将其中的键值对解析为 Node.js 的环境变量（process.env）

// 若你创建了 .env 文件，Node.js 不会自动读取它。必须通过 dotenv.config() 手动将 .env 文件内容解析到 process.env 中。

// 将 URL 路径转换为文件系统路径（如 /path/to/your/file.js）
const __filename = fileURLToPath(import.meta.url);
// 获取文件所在目录的路径（如 /path/to/your）
const __dirname = dirname(__filename);

dotenv.config({
  path: path.join(__dirname, ".env.local"),
});

dotenv.config({
  path: path.join(__dirname, ".env"),
});

const accessKey = process.env.QINIU_ACCESS_KEY;
const secretKey = process.env.QINIU_SECRET_KEY;
const bucket = process.env.QINIU_BUCKET;
const domain = process.env.QINIU_DOMAIN;
const prefix = process.env.QINIU_PREFIX;
const scope = process.env.QINIU_SCOPE;
const expires = process.env.QINIU_EXPIRES || '';

const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

const options = {
  scope: bucket,
  expires: +expires || 60 * 60 * 24 * 30,
};

const putPolicy = new qiniu.rs.PutPolicy(options);
const uploadToken = putPolicy.uploadToken(mac);

console.log(
  "expire",
  new Date(Date.now() + options.expires * 1000).toLocaleString()
);

const envToken = btoa(
  JSON.stringify({
    token: uploadToken,
    date: Date.now() + options.expires * 1000,
    domain,
    prefix,
    scope,
    bucket,
  })
);

if (!process.env.CI) {
  clipboardy.write(envToken);
  console.log("Token已经写入剪切板");
}
if (!process.env.copy) {
  // 将生成的七牛云上传凭证写入到项目的环境变量文件中
  fs.writeFileSync(
    path.join(__dirname, "../client/.env.local"),
    `VITE_APP_UPLOAD_TOKEN=${envToken}`
  );
}
