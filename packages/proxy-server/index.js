const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // 允许的前端域名
  credentials: true
}));
app.use(express.raw({ 
  type: 'application/octet-stream', 
  limit: '50mb' 
}));
app.use(express.json());

// TinyPNG 压缩代理接口
app.post('/api/tinypng/compress', async (req, res) => {
  const maxRetries = 2;
  let retryCount = 0;
  
  const compressWithRetry = async () => {
    try {
      console.log(`📤 收到压缩请求，文件大小: ${req.body.length} bytes${retryCount > 0 ? ` (重试 ${retryCount})` : ''}`);
      
      // 第一步：上传到 TinyPNG
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
        timeout: 60000, // 增加到60秒
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      console.log('✅ TinyPNG 处理成功，压缩率:', 
        Math.round((uploadResponse.data.output.size / req.body.length) * 100) + '%');
      
      // 第二步：下载压缩后的文件
      const downloadResponse = await axios({
        method: 'get',
        url: uploadResponse.data.output.url,
        responseType: 'arraybuffer',
        timeout: 60000, // 增加到60秒
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      // 返回压缩后的文件
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Length': downloadResponse.data.byteLength,
        'X-Original-Size': req.body.length,
        'X-Compressed-Size': downloadResponse.data.byteLength
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
    console.error('❌ TinyPNG 压缩失败:', error.message);
    
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
    apiKeyConfigured: !!process.env.TINYPNG_API_KEY
  });
});

app.listen(PORT, () => {
  console.log(`🚀 代理服务器启动成功: http://localhost:${PORT}`);
  console.log(`📋 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔑 API Key 状态:`, process.env.TINYPNG_API_KEY ? '已配置' : '未配置');
});