const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

// 根据NODE_ENV加载对应的环境变量
const NODE_ENV = process.env.NODE_ENV || 'development';
require('dotenv').config({
  path: path.resolve(__dirname, `.env.${NODE_ENV}`)
});
// 加载基础环境变量
require('dotenv').config();

const app = express();
const DEFAULT_PORT = 3001;
const PORT = process.env.PORT || DEFAULT_PORT;

// 获取当前环境的API URL的基础部分
const API_BASE_URL = process.env.VITE_API_BASE_URL || `http://localhost:${DEFAULT_PORT}`;

// 根据环境确定允许的前端域名
const allowedOrigins = NODE_ENV === 'production' 
  ? ['http://192.168.10.8:5173', 'http://192.168.10.8:3000', 'http://192.168.10.8', '*'] 
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost', '*']; 

// 中间件 - 增强CORS配置，允许更多来源
app.use(cors({
  origin: function(origin, callback) {
    // 允许没有origin的请求（如移动应用或Postman）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes('*') || allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin))) {
      callback(null, true);
    } else {
      console.warn(`CORS拒绝来自 ${origin} 的请求`);
      callback(new Error('不允许的跨域请求'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析二进制，并挂载到request.body
app.use(express.raw({ 
  type: 'application/octet-stream', 
  limit: '50mb' 
}));
// 解析 JSON, 并挂载到request.body
app.use(express.json());

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// TinyPNG 压缩代理接口 - 同时支持两种路径格式
app.post(['/api/tinypng/compress', '/tinypng/compress'], async (req, res) => {
  console.log(`收到压缩请求，文件大小: ${req.body.length} 字节`);
  const maxRetries = 2;
  let retryCount = 0;
  
  const compressWithRetry = async () => {
    try {
      // 第一步：上传到 TinyPNG
      console.log('正在上传到 TinyPNG...');
      const uploadResponse = await axios({
        method: 'post',
        url: 'https://api.tinify.com/shrink',
        auth: {
          username: 'api',
          password: process.env.TINYPNG_API_KEY
        },
        data: req.body,
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        timeout: 60000, // 60秒
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      // 第二步：下载压缩后的文件
      console.log('上传成功，正在下载压缩后的文件...');
      const downloadResponse = await axios({
        method: 'get',
        url: uploadResponse.data.output.url,
        responseType: 'arraybuffer',
        timeout: 60000, // 60秒
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      // 计算压缩率
      const originalSize = req.body.length;
      const compressedSize = downloadResponse.data.byteLength;
      const compressionRate = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
      
      console.log(`压缩成功! 原始大小: ${originalSize} 字节, 压缩后: ${compressedSize} 字节, 压缩率: ${compressionRate}%`);
      
      // 返回结果给前端
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Length': compressedSize,
        'X-Original-Size': originalSize,
        'X-Compressed-Size': compressedSize,
        'X-Compression-Rate': compressionRate
      });
      
      res.send(downloadResponse.data);
      
    } catch (error) {
      if (retryCount < maxRetries && (error.code === 'ECONNABORTED' || error.message.includes('aborted'))) {
        retryCount++;
        console.log(`🔄 连接中断，正在重试 (${retryCount}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // 递增延迟
        return compressWithRetry();
      }
      throw error;
    }
  };
  
  try {
    await compressWithRetry();
  } catch (error) {
    console.error('压缩失败:', error.message);
    
    // 检查错误类型
    if (error.response?.status === 429) {
      res.status(429).json({ 
        error: 'QUOTA_EXHAUSTED', 
        message: 'TinyPNG 配额已用完' 
      });
    } else if (error.response?.status === 401) {
      res.status(401).json({ 
        error: 'INVALID_API_KEY', 
        message: 'TinyPNG API Key 无效' 
      });
    } else if (error.code === 'ECONNABORTED' || error.message.includes('aborted')) {
      res.status(408).json({ 
        error: 'TIMEOUT', 
        message: '请求超时，请稍后重试' 
      });
    } else {
      res.status(500).json({ 
        error: 'COMPRESSION_FAILED', 
        message: error.message 
      });
    }
  }
});

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!process.env.TINYPNG_API_KEY,
    environment: NODE_ENV
  });
});

app.listen(PORT, () => {
  console.log(`🚀 代理服务器启动成功，端口: ${PORT}`);
  console.log(`📋 健康检查: ${API_BASE_URL}/health`);
  console.log(`🔑 API Key 状态:`, process.env.TINYPNG_API_KEY ? '已配置' : '未配置');
  console.log(`🌍 当前环境: ${NODE_ENV}`);
  console.log(`🔗 压缩接口: ${API_BASE_URL}/api/tinypng/compress 或 ${API_BASE_URL}/tinypng/compress`);
});