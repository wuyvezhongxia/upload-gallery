import { CloudUploadOutlined } from "@ant-design/icons";
import { Upload, type UploadFile } from "antd";
import "./index.scss";
import { useState, useRef } from "react";
import { useIsExpired } from "@/Hooks/isExpired";
import { useUploadConfig } from "@/Hooks/upload";
import { useFileUpload } from "@/Hooks/useFileUpload";
import { usePasteHandler } from "@/Hooks/usePasteHandler";
import { ProgressList } from "./components/ProgressList";

const { Dragger } = Upload;

const UploadFile = () => {
  const [isCopy, setIsCopy] = useState(false);
  const isExpired = useIsExpired();
  const { config } = useUploadConfig();
  const { fileList, addFileToQueue } = useFileUpload(config);
  const { pasteAreaRef } = usePasteHandler(isExpired, addFileToQueue, config);
  const processedFiles = useRef(new Set<string>());

  const handleBeforeUpload = async (file: File) => {
    return await addFileToQueue(file, isExpired);
  };

  /**
   * 处理批量上传
   * @param files 文件列表
   */
  const handleBatchUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    for (const file of files) {
      await addFileToQueue(file, isExpired);
    }
  };
  
  /**
   * 处理上传组件的 onChange 事件
   * @param info 上传信息
   */
  const handleUploadChange = (info: any) => {
    // 只在文件状态为 uploading 且有文件列表时处理批量上传
    if (info.file.status === 'uploading' && info.fileList.length > 0) {
      // 获取有效的文件对象
      const validFiles = info.fileList
        .filter((fileItem: any) => {
          // 创建文件唯一标识（使用文件名和大小组合）
          const fileId = `${fileItem.name}-${fileItem.size}`;
          
          // 如果文件已处理过，则跳过
          if (processedFiles.current.has(fileId)) {
            return false;
          }
          
          // 标记文件为已处理
          processedFiles.current.add(fileId);
          return fileItem.originFileObj;
        })
        .map((fileItem: any) => fileItem.originFileObj)
        .filter(Boolean);
      
      if (validFiles.length > 0) {
        handleBatchUpload(validFiles);
      }
    }
  };

  const copyFile = () => {
    setIsCopy(true);
  };

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

      <Dragger 
        beforeUpload={handleBeforeUpload} 
        showUploadList={false}
        onChange={handleUploadChange}
        multiple={true}>
        <p className="ant-upload-drag-icon">
          <CloudUploadOutlined />
        </p>
        <p className="ant-upload-text">
          拖拽文件到这里或<span>点击上传</span>
        </p>
      </Dragger>

      <ProgressList fileList={fileList} />
    </div>
  );
};

export default UploadFile;
