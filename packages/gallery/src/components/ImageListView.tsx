import React from 'react';
import { List, Image, Typography, Space, Tag } from 'antd';
import type { ImageItem } from '@yuanjing/shared';
import { FileImageOutlined } from '@ant-design/icons';

interface ImageListViewProps {
  imgList?: ImageItem[];
}

const ImageListView: React.FC<ImageListViewProps> = ({ imgList = [] }) => {
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
          <List.Item>
            <div style={{ display: 'flex', width: '100%', alignItems: 'center', padding: '12px' }}>
              <div style={{ marginRight: '20px', width: '120px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: '#f0f2f5' }}>
                {item.url ? (
                  <Image
                    src={item.url}
                    alt={item.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    preview={{ src: item.url }}
                  />
                ) : (
                  <FileImageOutlined style={{ fontSize: '32px', color: '#bfbfbf' }} />
                )}
              </div>
              
              <div style={{ flex: 1 }}>
                <Typography.Title level={5} style={{ margin: 0 }}>{item.name}</Typography.Title>
                <Space direction="vertical" size={2} style={{ marginTop: '8px' }}>
                  <Typography.Text type="secondary">
                    <Space>
                      <span>拍摄时间: {formattedDate}</span>
                      <Tag color="blue">{formatSize(item.size)}</Tag>
                      {item.originSize && (
                        <Tag color="green">原始大小: {formatSize(item.originSize)}</Tag>
                      )}
                    </Space>
                  </Typography.Text>
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