import React from 'react';
import { Image, Card, Typography } from 'antd';
import type { ImageItem } from '@yuanjing/shared';
import { FileImageOutlined } from '@ant-design/icons';

interface ImageGridViewProps {
  imgList?: ImageItem[];
}

const ImageGridView: React.FC<ImageGridViewProps> = ({ imgList = [] }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
      {imgList.map((item) => {
        // 格式化文件大小
        const formatSize = (size: number) => {
          if (size < 1024) return `${size} B`;
          if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
          return `${(size / (1024 * 1024)).toFixed(2)} MB`;
        };

        return (
          <Card
            key={item.id}
            hoverable
            cover={
              <div style={{ height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' }}>
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
            }
          >
            <Card.Meta
              title={item.name}
              description={
                <Typography.Text type="secondary">
                  {formatSize(item.size)}
                </Typography.Text>
              }
            />
          </Card>
        );
      })}
    </div>
  );
};

export default ImageGridView;