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
            <div className="file-details">
              <div className="file-name-container">
                <span className="file-name">{file.name}</span>
                {file.compressInfo && (
                  <span className="compress-text">{file.compressInfo}</span>
                )}
              </div>
              <span className="file-status">
                {file.status === "compressing" && (
                  <>
                    <LoadingOutlined /> 压缩中...
                  </>
                )}
                {file.status === "uploading" && (
                  <>
                    <LoadingOutlined /> 上传中...
                  </>
                )}
                {file.status === "success" && "✅ 上传成功"}
                {file.status === "error" && "❌ 上传失败"}
                {file.status === "ready" && "⏳ 准备上传"}
              </span>
            </div>
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
            showInfo={true}
            strokeColor={
              file.status === "compressing"
                ? "#1890ff"
                : file.status === "uploading"
                ? "#52c41a"
                : undefined
            }
          />
        </Card>
      ))}
    </div>
  );
};
