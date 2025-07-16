import { CloudUploadOutlined } from "@ant-design/icons";
import { Upload } from "antd";
import "./index.scss";
import { useState } from "react";
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

  const handleBeforeUpload = async (file: File) => {
    return await addFileToQueue(file, isExpired);
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

      <Dragger beforeUpload={handleBeforeUpload} showUploadList={false}>
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
