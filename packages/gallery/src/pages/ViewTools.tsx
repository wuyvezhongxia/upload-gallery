import React from 'react';
import type { ImageItem } from '@yuanjing/shared';
import ImageListView from '../components/ImageListView';

interface ViewToolsProps {
  imgList?: ImageItem[];
}

const ViewTools: React.FC<ViewToolsProps> = ({ imgList = [] }) => {
  return (
    <div>
      {/* 移除控制按钮区域，直接显示列表视图 */}
      <div style={{ padding: '0 20px' }}>
        <ImageListView imgList={imgList} />
      </div>
    </div>
  );
};

export default ViewTools;