import React from 'react';
import { Image } from 'antd';
import type { ImageItem } from '@yuanjing/shared';
import { FileImageOutlined, DownloadOutlined, HeartOutlined } from '@ant-design/icons';

interface ImageGridViewProps {
  imgList?: ImageItem[];
}

const ImageGridView: React.FC<ImageGridViewProps> = ({ imgList = [] }) => {
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

  return (
    <div className="masonry-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gridGap: '16px',
      gridAutoFlow: 'dense'
    }}>
      {imgList.map((item) => (
        <div key={item.id} className="masonry-item" style={{ display: 'inline-block', position: 'relative' }}>
          {item.url ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={item.url}
                alt={item.name}
                style={{ display: 'block', width: '100%', height: 'auto' }}
                onClick={() => {
                  // 使用原生方法打开图片预览
                  const img = new Image();
                  img.src = item.url;
                  const win = window.open('');
                  win?.document.write(img.outerHTML);
                }}
              />
              
              {/* 悬停时显示的信息层 */}
              <div className="image-overlay" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
                <h4 style={{ color: 'white', margin: '0 0 8px 0' }}>
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
                    padding: '4px 8px',
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
                    padding: '4px 8px',
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
            <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' }}>
              <FileImageOutlined style={{ fontSize: '32px', color: '#bfbfbf' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// 添加全局CSS样式
const addGlobalStyle = () => {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = `
    .masonry-item:hover .image-overlay {
      opacity: 1 !important;
    }
    
    /* 响应式布局 */
    @media (max-width: 768px) {
      .masonry-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;
      }
    }
    @media (max-width: 480px) {
      .masonry-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
      }
    }
  `;
  document.head.appendChild(styleElement);
};

// 组件挂载时添加全局样式
if (typeof window !== 'undefined') {
  addGlobalStyle();
}

export default ImageGridView;