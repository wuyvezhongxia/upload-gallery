import React from 'react';

export interface ImageItem {
  id: number;
  url: string;
  name: string;
  date: number;
  size: number;
  originSize?: number;
}

export interface GalleryPageProps {
  imgList: ImageItem[];
}

const GalleryPage: React.FC<GalleryPageProps> = ({ imgList }) => {
  return (
    <div style={{ padding: 24 }}>
      <h1>图片画廊</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {imgList.map(img => (
          <div key={img.id} style={{ width: 200, border: '1px solid #eee', padding: 8, borderRadius: 8 }}>
            <img src={img.url} alt={img.name} style={{ width: '100%', borderRadius: 4 }} />
            <div style={{ fontWeight: 500 }}>{img.name}</div>
            <div style={{ color: '#888' }}>{(img.size / 1024).toFixed(2)} KB</div>
            <div style={{ color: '#aaa', fontSize: 12 }}>{new Date(img.date).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryPage; 