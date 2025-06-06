import qiniu from 'qiniu'
import fs from 'fs/promise'
import path,{dirname} from 'path'
import {fileURLToPath} from 'url'
import dotenv from "dotenv"
// import process from 'process'

import clipboardy from 'clipboardy'

// dotenv 会读取项目根目录或指定路径下的 .env 文件，将其中的键值对解析为 Node.js 的环境变量（process.env）

// 若你创建了 .env 文件，Node.js 不会自动读取它。必须通过 dotenv.config() 手动将 .env 文件内容解析到 process.env 中。

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const loadConfig = ()=>{
    dotenv.config({
        path:path.join(__dirname,'.env.local')
    })
    dotenv.config({
        path:path.join(__dirname,'.env')
    })

    const requiredVars = [
        'QINIU_ACCESS_KEY',
        'QINIU_SECRET_KEY',
        'QINIU_BUCKET',
        'QINIU_DOMAIN',
    ]
    
    const missingVars = requiredVars.filter(varName => !process.env[varName])

    if(missingVars.length>0){
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')} `)
    }
    return {
        accessKey:process.env.QINIU_ACCESS_KEY,
        secretKey:process.env.QINIU_SECRET_KEY,
        bucket:process.env.QINIU_BUCKET,
        domain:process.env.QINIU_DOMAIN,
        prefix:process.env.QINIU_PREFIX,
        scope:process.env.QINIU_SCOPE,
        expires:parseInt(process.env.QINIU_EXPIRES || '2592000'),
        outputPath:process.env.OUTPUTPATH || path.join(__dirname, 'output.txt')

    }
}

const generateUploadToken = (config)=>{
    const mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey)

    const options = {
        scope:config.scope || config.bucket,
        expires:config.expires
    }
    
    const putPolicy = new qiniu.rs.PutPolicy(options)
    return putPolicy.uploadToken(mac)

}


const handleTokenOutput = async (envToken,config)=>{
    const expirationData = new Date(Date.now() + config.expires * 1000);

    console.log('Token expires at:', expirationData.toLocaleString);
    
    try{
        if(!process.env.CI){
            await clipboardy.write(envToken)
            console.log('Token copied to clipboard')
        }
        if(!process.env.copy){
            await fs.writeFile(config.outputPath,`VITE_APP_UPLOAD_TOKEN = ${envToken}`)
            console.log(`token已写入文件: ${config.outputPath}`)
        }
    }catch(error){
        console.error("输出token时出错： ", error.message);
        process.exit(1)
        
    }
}

const main = async () => {
  try {
    const config = loadConfig();
    const uploadToken = generateUploadToken(config);

/* 
    const envToken = Buffer.from(JSON.stringify({
        token: uploadToken,
        date: Date.now() + config.expires * 1000,
        domain: config.domain,
        prefix: config.prefix,
        scope: config.scope,
        bucket: config.bucket,
    })).toString('base64');
 */
    const envToken = btoa(
      JSON.stringify({
        token: uploadToken,
        date: Date.now() + config.expires * 1000,
        domain: config.domain,
        prefix: config.prefix,
        scope: config.scope,
        bucket: config.bucket,
      })
    );

    await handleTokenOutput(envToken, config);
  } catch (error) {
    console.error("生成Token失败:", error.message);
    process.exit(1);
  }
};

main();