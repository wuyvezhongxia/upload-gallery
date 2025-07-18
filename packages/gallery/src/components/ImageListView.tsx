import React, { useState } from 'react';
import { List, Typography, Space, Tag} from 'antd';
import type { ImageItem } from '@yuanjing/shared';
import { FileImageOutlined } from '@ant-design/icons';
import 'react-lazy-load-image-component';
// 导入自定义的颜色过渡效果CSS
import '../effects/colorTransition.css';
import ColorLazyImage from './ColorLazyImage';

interface ImageListViewProps {
  imgList?: ImageItem[];
}

const ImageListView: React.FC<ImageListViewProps> = ({ imgList = [] }) => {
  // 添加状态跟踪图片加载
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  // 处理图片加载完成
  const handleImageLoad = (id: number) => {
    setLoadedImages(prev => ({ ...prev, [id.toString()]: true }));
  };

  return (
    <List
      itemLayout="horizontal"
      dataSource={imgList}
      renderItem={(item) => {
        // 将时间戳转换为可读日期
        const date = new Date(item.date);
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        
        // 格式化文件大小
        const formatSize = (size: number) => {
          if (size < 1024) return `${size} B`;
          if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
          return `${(size / (1024 * 1024)).toFixed(2)} MB`;
        };

        return (
          <List.Item
            style={{ 
              padding: '16px', 
              borderBottom: '1px solid #f0f0f0'
            }}
          >
            <div style={{ 
              display: 'flex', 
              width: '100%',
              gap: '24px'
            }}>
              {/* 左侧图片区域 - 增加宽度到80% */}
              <div style={{ 
                width: '80%',
                flexShrink: 0
              }}>
                {item.url ? (
                  <div style={{ position: 'relative', width: '100%' }}>
                    <ColorLazyImage
                      src={item.url}
                      alt={item.name}
                      threshold={100}
                      delayTime={5000} // 5秒延迟
                      afterLoad={() => handleImageLoad(item.id)}
                      wrapperProps={{
                        style: {
                          width: '100%',
                          display: 'block',
                        }
                      }}
                      style={{ 
                        width: '100%',
                        height: 'auto',
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ 
                    height: '320px', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '4px'
                  }}>
                    <FileImageOutlined style={{ fontSize: '64px', color: '#bfbfbf' }} />
                  </div>
                )}
              </div>
              
              {/* 右侧信息区域 */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'flex-start',
                flex: 1,
                padding: '8px 0'
              }}>
                <Typography.Title level={5} style={{ margin: '0 0 8px 0' }}>{item.name}</Typography.Title>
                
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Typography.Text type="secondary">拍摄时间: {formattedDate}</Typography.Text>
                  <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Tag color="blue" style={{ width: 'fit-content' }}>{formatSize(item.size)}</Tag>
                    {item.originSize && (
                      <Tag color="green" style={{ width: 'fit-content' }}>
                        原始大小: {formatSize(item.originSize)}
                      </Tag>
                    )}
                  </div>
                </Space>
              </div>
            </div>
          </List.Item>
        );
      }}
    />
  );
};

export default ImageListView;