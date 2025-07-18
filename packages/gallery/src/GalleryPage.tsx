import React from 'react';
import type { ImageItem } from '@yuanjing/shared';
import ViewTools from './pages/ViewTools';

export interface GalleryPageProps {
  imgList: ImageItem[];
}

const GalleryPage: React.FC<GalleryPageProps> = ({ imgList }) => {
  return (
    <div style={{ padding: 24, background: '#fafbfc', minHeight: '100vh' }}>
      <ViewTools imgList={imgList} />
    </div>
  );
};

export default GalleryPage;