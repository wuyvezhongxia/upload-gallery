import { LoadingOutlined } from "@ant-design/icons";
import { Progress, Card } from "antd";
import type { UploadableFile } from "../types";

interface ProgressListProps {
  fileList: UploadableFile[];
}

export const ProgressList: React.FC<ProgressListProps> = ({ fileList }) => {
  if (fileList.length === 0) return null;

  return (
    <div className="upload-progress-container">
      {fileList.map((file) => (
        <Card
          key={file.uid}
          className={`upload-progress-item ${file.status}`}
          size="small"
        >
          <div className="file-info">
            <div className="file-name-wrapper">
              <span className="file-name" title={file.name}>{file.name}</span>
              {file.status === "compressing" && (
                <span className="tiny-compress-status">
                  <LoadingOutlined /> 压缩中...
                </span>
              )}
            </div>
            
            <Progress
              percent={file.percent || 0}
              status={
                file.status === "error"
                  ? "exception"
                  : file.status === "success"
                  ? "success"
                  : "active"
              }
              size="small"
              showInfo={false}
              strokeColor={
                file.status === "compressing"
                  ? "#1890ff"
                  : file.status === "uploading"
                  ? "#52c41a"
                  : undefined
              }
            />
            
            <div className="file-status">
              {file.status === "uploading" && (
                <>
                  <LoadingOutlined /> {file.percent}%
                </>
              )}
              {file.status === "compressing" && (
                <>
                  {file.percent}%
                </>
              )}
              {file.status === "success" && "✅ 上传成功"}
              {file.status === "error" && "❌ 上传失败"}
              {file.status === "ready" && "⏳ 准备上传"}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
