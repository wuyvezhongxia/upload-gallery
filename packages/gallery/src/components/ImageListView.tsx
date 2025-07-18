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
      itemLayout="vertical"
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
            style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Typography.Title level={5} style={{ margin: '0 0 12px 0' }}>{item.name}</Typography.Title>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', backgroundColor: '#f5f5f5', padding: '16px' }}>
                {item.url ? (
                  <Image
                    src={item.url}
                    alt={item.name}
                    style={{ maxHeight: '300px', objectFit: 'contain' }}
                    preview={{ src: item.url }}
                  />
                ) : (
                  <FileImageOutlined style={{ fontSize: '64px', color: '#bfbfbf' }} />
                )}
              </div>
              
              <div style={{ marginTop: '8px' }}>
                <Space direction="vertical" size={4}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography.Text type="secondary">拍摄时间: {formattedDate}</Typography.Text>
                    <Space>
                      <Tag color="blue">{formatSize(item.size)}</Tag>
                      {item.originSize && (
                        <Tag color="green">原始大小: {formatSize(item.originSize)}</Tag>
                      )}
                    </Space>
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