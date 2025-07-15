import { Button, Pagination, ConfigProvider, Modal } from "antd";
import type { PaginationProps } from "antd";
import "./index.scss";
import zhCN from "antd/locale/zh_CN";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { calculateCompressionPercentage, formatSize } from "@/utils/transform";
import { fomatData, copyUrl, copyMd } from "@/utils/stringUtil";
import type { ImageItem } from "@/store/modules/imageStore";
import { useState } from "react";
import { useUploadConfig } from "@/Hooks/upload";

const FileList = () => {
  const { imgList } = useSelector((state: RootState) => state.image);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImg, setCurrentImg] = useState<ImageItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { config, updateConfig } = useUploadConfig();

  const onShowSizeChange: PaginationProps["onShowSizeChange"] = (
    current,
    pageSize
  ) => {
    updateConfig({ pageSize });
    setCurrentPage(1);
  };

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  const preview = (item: ImageItem) => {
    setIsModalOpen(true);
    setCurrentImg(item);
  };

  const onCopyUrl = async (url: string) => {
    copyUrl(url)
  };

  const onCopyMd = async (url: string, name?: string) => {
    copyMd(url,name)
  };

  const startIndex = (currentPage - 1) * config.pageSize;
  const endIndex = startIndex + config.pageSize;
  const currentPageData = imgList.slice(startIndex, endIndex);

  return (
    <ConfigProvider locale={zhCN}>
      <div className="listContainer">
        <p className="top">历史上传记录 ↓（本地存储）</p>
        {imgList.length === 0 ? (
          <div className="empty-state">
            <p>暂无上传记录</p>
          </div>
        ) : (
          <ul className="file-list">
            {currentPageData.map((item, index) => (
              <li key={startIndex + index}>
                <span className="left">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.name}
                  </a>
                </span>
                <span className="right">
                  <Button title="文件大小">{formatSize(item.size)}</Button>
                  <Button onClick={() => preview(item)} title="查看图片信息">
                    查看
                  </Button>
                  <Button onClick={() => onCopyUrl(item.url)} title="复制链接">
                    链接
                  </Button>
                  <Button
                    onClick={() => onCopyMd(item.url, item.name)}
                    title="复制Markdown格式"
                  >
                    MD
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="pagination">
          <Pagination
            total={imgList.length}
            showTotal={(total) => `共 ${total} 条`}
            onShowSizeChange={onShowSizeChange}
            onChange={onPageChange}
            current={currentPage}
            pageSize={config.pageSize}
            showSizeChanger={true}
            pageSizeOptions={["10", "20", "50", "100", "200"]}
          />
        </div>

        <Modal
          title="图片信息"
          open={isModalOpen}
          onOk={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
          width={600}
          footer={[
            <Button
              key="copy-url"
              onClick={() => currentImg && onCopyUrl(currentImg.url)}
            >
              复制链接
            </Button>,
            <Button
              key="copy-md"
              onClick={() =>
                currentImg && onCopyMd(currentImg.url, currentImg.name)
              }
            >
              复制MD
            </Button>,
            <Button
              key="close"
              type="primary"
              onClick={() => setIsModalOpen(false)}
            >
              关闭
            </Button>,
          ]}
        >
          {currentImg && (
            <div className="preview-info">
              <div style={{ marginBottom: "16px", textAlign: "center" }}>
                <img
                  src={currentImg.url}
                  alt={currentImg.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "300px",
                    objectFit: "contain",
                    border: "1px solid #d9d9d9",
                    borderRadius: "6px",
                  }}
                />
              </div>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li>图片名：{currentImg.name}</li>
                <li>
                  链接:
                  <a
                    target="_blank"
                    href={currentImg.url}
                    rel="noopener noreferrer"
                    style={{ marginLeft: "8px", color: "#1890ff" }}
                  >
                    点击查看原图
                  </a>
                </li>
                {currentImg.date && (
                  <li>
                    上传时间{fomatData(currentImg.date, "YYYY-MM-DD HH:mm:ss")}
                  </li>
                )}
                <li>文件大小：{formatSize(currentImg.size)}</li>
                {currentImg.originSize && (
                  <li style={{ marginBottom: "8px" }}>
                    压缩前大小：{formatSize(currentImg.originSize)}
                  </li>
                )}
                {currentImg.originSize && (
                  <li>
                    压缩率：
                    {calculateCompressionPercentage(
                      currentImg.originSize,
                      currentImg.size
                    )}
                    %
                  </li>
                )}
              </ul>
            </div>
          )}
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default FileList;
