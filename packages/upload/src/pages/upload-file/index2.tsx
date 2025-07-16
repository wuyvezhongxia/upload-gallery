import { CloudUploadOutlined, LoadingOutlined } from "@ant-design/icons";
import { Upload, message, Progress, Card } from "antd";
import './index.scss'
import { useState, useEffect, useRef } from "react";
import { addImage } from "../../store/modules/imageStore";
import { uploadFile } from "../../utils/qiniu";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store";
import { compressImage } from "../../utils/image";
import { v4 as uuidv4 } from 'uuid'
import { useIsExpired } from "@/Hooks/isExpired";
import { useUploadConfig } from "@/Hooks/upload";
import { copyUrl, copyMd } from "@/utils/stringUtil";
import { calculateCompressionPercentage, formatSize } from "@/utils/transform";

const { Dragger } = Upload;

// 定义文件状态的接口
interface UploadableFile {
  uid: string;
  raw: File;
  name: string;
  status: "ready" | "compressing" | "uploading" | "success" | "error";
  percent?: number;
  originalSize?: number;
  compressInfo?: string; // 压缩信息
  compressionRate?: string; // 压缩率
}

const UploadFile = () => {
  const [isCopy, setIsCopy] = useState(false);
  const dispatch = useDispatch();
  const { qiniu } = useSelector((state: RootState) => state.config);
  const [fileList, setFileList] = useState<UploadableFile[]>([])
  const pasteAreaRef = useRef<HTMLTextAreaElement>(null)
  const isExpired = useIsExpired();
  const { config } = useUploadConfig();
  const uploadingFiles = useRef(new Set<string>());

  useEffect(() => {
    const uploadQueue = fileList.filter(file => 
      file.status === 'ready' && !uploadingFiles.current.has(file.uid)
    )
    if (uploadQueue.length === 0) return

    const upload = async (file: UploadableFile) => {
      uploadingFiles.current.add(file.uid);
      
      setFileList((prev) =>
        prev.map(f => f.uid === file.uid ? { ...f, status: 'uploading', percent: 0 } : f)
      );
      
      try {
        const url = await uploadFile(file.raw, qiniu, {
          process: (percent) => {
            setFileList(prev => prev.map(f => f.uid === file.uid ? { ...f, percent } : f))
          }
        })
        
        if (url) {
          message.success(`${file.name}上传成功`);
        }
        
        if (config.autoCopy) {
          if (config.copyType === "Markdown") {
            await copyMd(url, file.name);
          } else {
            await copyUrl(url);
          }
        }
        
        dispatch(addImage({
          id: uuidv4(),
          url,
          name: file.name || 'image',
          size: file.raw.size,
          originSize: file.originalSize || file.raw.size,
          date: Date.now()
        }))
        
        setFileList(prev => prev.map(f => f.uid === file.uid ? { ...f, status: 'success', percent: 100 } : f))
        
        setTimeout(() => {
          setFileList((prev) => prev.filter(f => f.uid !== file.uid))
          uploadingFiles.current.delete(file.uid);
        }, 3000)
        
      } catch (error) {
        message.error(`${file.name} 上传失败: ${error}`);
        setFileList((prev) =>
          prev.map((f) => (f.uid === file.uid ? { ...f, status: "error" } : f))
        );
        uploadingFiles.current.delete(file.uid);
      }
    }
    
    uploadQueue.forEach(upload)
  }, [fileList])

  // 处理拖拽上传
  const handleBeforeUpload = async (file: File) => {
    if (isExpired) {
      message.error("七牛云Token已过期, 请重新配置");
      return;
    }
    
    const isImage = file.type.startsWith("image/")
    if (!isImage) {
      message.error('只能上传图片')
      return false
    }
    
    const originalSize = file.size;
    let processedFile: File = file;
    const tempUid = `drag-${Date.now()}-${Math.random()}`;
    
    if (config.compressImage) {
      // 先添加压缩中的文件到列表
      setFileList((prev) => [
        ...prev,
        {
          uid: tempUid,
          raw: file,
          name: file.name,
          status: 'compressing',
          percent: 0,
          originalSize: originalSize,
          compressInfo: '准备压缩...'
        },
      ]);
      
      try {
        processedFile = await compressImage(file, {
          quality: 80,
          width: 1200,
          noCompressIfLarger: true,
          useTinyPng: true,
          onProgress: (percent, info) => {
            setFileList(prev => prev.map(f => 
              f.uid === tempUid ? { 
                ...f, 
                percent: Math.round(percent),
                compressInfo: info || '压缩中...'
              } : f
            ));
          }
        });
        
        // 计算压缩率
        const compressionRate = calculateCompressionPercentage(originalSize, processedFile.size);
        const originalSizeStr = formatSize(originalSize);
        const compressedSizeStr = formatSize(processedFile.size);
        
        // 压缩完成，更新状态
        setFileList(prev => prev.map(f => 
          f.uid === tempUid ? {
            ...f,
            raw: processedFile,
            status: 'ready',
            percent: 0,
            compressionRate: `${compressionRate}%`,
            compressInfo: `${originalSizeStr} → ${compressedSizeStr} (压缩率: ${compressionRate}%)`
          } : f
        ));        
      } catch (error: any) {
        console.error('压缩过程出错,改用本地压缩', error);
        
        setFileList(prev => prev.map(f => 
          f.uid === tempUid ? {
            ...f,
            status: 'ready',
            percent: 0,
            compressInfo: '压缩失败，使用原文件'
          } : f
        ));
        
        message.warning('压缩失败，使用原文件上传');
      }
    } else {
      // 不压缩直接添加
      setFileList((prev) => [
        ...prev,
        {
          uid: tempUid,
          raw: processedFile,
          name: processedFile.name,
          status: 'ready',
          percent: 0,
          originalSize: originalSize
        },
      ]);
    }
    
    return false;
  }
  
  const copyFile = () => {
    setIsCopy(true);
  };
  
  // 处理粘贴事件（类似的更新）
  useEffect(() => {
    if (isExpired) {
      message.error("七牛云Token已过期, 请重新配置");
      return;
    }
    
    const handlePaste = async (e: ClipboardEvent) => {
      e.preventDefault()
      const items = e.clipboardData?.items;
      if (!items) return;
      
      let hasImage = false;
      
      for (const item of Array.from(items)) {
        if (item.kind === 'file' && item.type.startsWith('image')) {
          const file = item.getAsFile()
          if (file) {
            hasImage = true
            const originalSize = file.size;
            let processedFile: File = file;
            const tempUid = `paste-${Date.now()}-${Math.random()}`;
            
            if (config.compressImage) {
              setFileList((prev) => [
                ...prev,
                {
                  uid: tempUid,
                  raw: file,
                  name: file.name || `pasted-image-${Date.now()}`,
                  status: 'compressing',
                  percent: 0,
                  originalSize: originalSize,
                  compressInfo: '准备压缩...'
                },
              ]);
              
              try {
                processedFile = await compressImage(file, {
                  quality: 80,
                  width: 1200,
                  noCompressIfLarger: true,
                  useTinyPng: true,
                  onProgress: (percent, info) => {
                    setFileList(prev => prev.map(f => 
                      f.uid === tempUid ? { 
                        ...f, 
                        percent: Math.round(percent),
                        compressInfo: info || '压缩中...'
                      } : f
                    ));
                  }
                });
                
                const compressionRate = calculateCompressionPercentage(originalSize, processedFile.size);
                const originalSizeStr = formatSize(originalSize);
                const compressedSizeStr = formatSize(processedFile.size);
                
                setFileList(prev => prev.map(f => 
                  f.uid === tempUid ? {
                    ...f,
                    raw: processedFile,
                    status: 'ready',
                    percent: 0,
                    compressionRate: `${compressionRate}%`,
                    compressInfo: `${originalSizeStr} → ${compressedSizeStr} (压缩率: ${compressionRate}%)`
                  } : f
                ));
                                
              } catch (error: any) {
                console.error('压缩失败', error);
                
                setFileList(prev => prev.map(f => 
                  f.uid === tempUid ? {
                    ...f,
                    status: 'ready',
                    percent: 0,
                    compressInfo: '压缩失败，使用原文件'
                  } : f
                ));
                
                message.warning('压缩失败，使用原文件上传');
              }
            } else {
              setFileList((prev) => [
                ...prev,
                {
                  uid: tempUid,
                  raw: processedFile,
                  name: processedFile.name || `pasted-image-${Date.now()}`,
                  status: "ready",
                  percent: 0,
                  originalSize: originalSize
                },
              ]);
            }
          }
        }
      }
      
      if (!hasImage) {
        message.error("剪贴板中没有图片");
      }
    }
    
    const el = pasteAreaRef.current;
    if (el) {
      el.addEventListener("paste", handlePaste);
    }
    return () => {
      if (el) {
        el.removeEventListener("paste", handlePaste);
      }
    };
  }, [config.compressImage])
  
  return (
    <div className="upload-container">
      <textarea
        ref={pasteAreaRef}
        className={isCopy ? "paste-active" : ""}
        id="paste-area"
        placeholder={
          !isCopy
            ? "你也可以点击此处，然后粘贴你要上传的图片"
            : "现在你可以粘贴了"
        }
        onClick={copyFile}
        readOnly
      />

      <Dragger beforeUpload={handleBeforeUpload} showUploadList={false}>
        <p className="ant-upload-drag-icon">
          <CloudUploadOutlined />
        </p>
        <p className="ant-upload-text">
          拖拽文件到这里或<span>点击上传</span>
        </p>
      </Dragger>
      
      {/* 进度条显示区域 */}
      {fileList.length > 0 && (
        <div className="upload-progress-container">
          {fileList.map((file) => (
            <Card key={file.uid} className={`upload-progress-item ${file.status}`} size="small">
              <div className="file-info">
                <div className="file-details">
                  <span className="file-name">{file.name}</span>
                  <span className="file-status">
                    {file.status === 'compressing' && (
                      <><LoadingOutlined /> 压缩中...</>
                    )}
                    {file.status === 'uploading' && (
                      <><LoadingOutlined /> 上传中...</>
                    )}
                    {file.status === 'success' && '✅ 上传成功'}
                    {file.status === 'error' && '❌ 上传失败'}
                    {file.status === 'ready' && '⏳ 准备上传'}
                  </span>
                </div>
                
                {/* 显示压缩信息 */}
                {file.compressInfo && (
                  <div className="compress-info">
                    <span className="compress-text">{file.compressInfo}</span>
                  </div>
                )}
              </div>
              
              <Progress 
                percent={file.percent || 0} 
                status={
                  file.status === 'error' ? 'exception' : 
                  file.status === 'success' ? 'success' : 
                  'active'
                }
                size="small"
                showInfo={true}
                strokeColor={
                  file.status === 'compressing' ? '#1890ff' :
                  file.status === 'uploading' ? '#52c41a' :
                  undefined
                }
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadFile;

