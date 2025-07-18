import React, { useState } from 'react';
import type { ImageItem } from '@yuanjing/shared';
import { FileImageOutlined, DownloadOutlined, HeartOutlined, CloseOutlined } from '@ant-design/icons';

interface ImageGridViewProps {
  imgList?: ImageItem[];
}

const ImageGridView: React.FC<ImageGridViewProps> = ({ imgList = [] }) => {
  // 添加状态来控制预览
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null);

  // 格式化文件大小
  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 格式化日期
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 打开预览
  const openPreview = (item: ImageItem) => {
    setPreviewImage(item);
    // 禁用页面滚动
    document.body.style.overflow = 'hidden';
  };

  // 关闭预览
  const closePreview = () => {
    setPreviewImage(null);
    // 恢复页面滚动
    document.body.style.overflow = 'auto';
  };

  return (
    <>
      {/* 整体容器，减少左右padding使其与上方组件对齐 */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '24px 0', // 移除左右padding，保留上下padding
        minHeight: '100vh'
      }}>
        {/* 图片预览区域 */}
        {previewImage && (
          <div className="image-preview-container" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            animation: 'fadeIn 0.3s ease'
          }}>
            {/* 预览头部 */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}>
              <h3 style={{ color: 'white', margin: 0 }}>{previewImage.name}</h3>
              <button 
                onClick={closePreview}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  transition: 'background-color 0.3s'
                }}
              >
                <CloseOutlined />
              </button>
            </div>
            
            {/* 预览图片 */}
            <div style={{ maxWidth: '100%', maxHeight: 'calc(100% - 160px)', overflow: 'auto' }}>
              <img 
                src={previewImage.url} 
                alt={previewImage.name}
                style={{ 
                  width: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }} 
              />
            </div>
            
            {/* 预览底部信息 */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div>{formatDate(previewImage.date)}</div>
                <div>{formatSize(previewImage.size)}</div>
              </div>
              <button style={{
                backgroundColor: '#1677ff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <DownloadOutlined /> 下载
              </button>
            </div>
          </div>
        )}

        {/* 图片网格 - 调整宽度和间距 */}
        <div className="image-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)', // 固定为3列
          columnGap: '40px', // 增加左右间距，从20px改为40px
          rowGap: '16px',    // 保持上下间距不变
          gridAutoRows: '280px', // 保持高度不变
          width: '100%', // 使用100%宽度
          maxWidth: '100%', // 移除最大宽度限制
          padding: '0 24px' // 增加内边距
        }}>
          {imgList.map((item) => (
            <div key={item.id} className="grid-item" style={{ 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
              borderRadius: '12px', // 保持圆角
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)', // 增强阴影效果
              backgroundColor: 'white', // 白色背景
              transition: 'transform 0.3s, box-shadow 0.3s' // 添加过渡效果
            }}>
              {item.url ? (
                <div style={{ 
                  position: 'relative', 
                  flex: 1,
                  overflow: 'hidden'
                }}>
                  <img
                    src={item.url}
                    alt={item.name}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      objectPosition: 'center',
                      display: 'block',
                      cursor: 'pointer'
                    }}
                    onClick={() => openPreview(item)}
                  />
                  
                  {/* 悬停时显示的信息层 */}
                  <div className="image-overlay" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 稍微透明一些
                    color: 'white',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '16px',
                    textAlign: 'center',
                  }}>
                    <h4 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '16px' }}>
                      {item.name}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                        {formatDate(item.date)}
                      </span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                        {formatSize(item.size)}
                      </span>
                    </div>
                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                      <button style={{
                        backgroundColor: '#1677ff',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <DownloadOutlined /> 下载
                      </button>
                      <button style={{
                        backgroundColor: '#ff4d4f',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <HeartOutlined /> 收藏
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' }}>
                  <FileImageOutlined style={{ fontSize: '32px', color: '#bfbfbf' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// 添加全局CSS样式
const addGlobalStyle = () => {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = `
    body {
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
    }
    
    .grid-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    
    .grid-item:hover .image-overlay {
      opacity: 1 !important;
    }
    
    /* 响应式布局 */
    @media (max-width: 1024px) {
      .image-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        column-gap: 30px !important; // 增加间距
      }
    }
    @media (max-width: 640px) {
      .image-grid {
        grid-template-columns: 1fr !important;
        grid-auto-rows: 240px !important;
        column-gap: 20px !important; // 增加间距
      }
    }
    
    /* 添加淡入动画 */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
  document.head.appendChild(styleElement);
};

// 组件挂载时添加全局样式
if (typeof window !== 'undefined') {
  addGlobalStyle();
}

export default ImageGridView;