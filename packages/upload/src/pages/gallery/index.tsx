import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { GalleryPage } from '@yuanjing/gallery';

export default function GalleryRoute() {
  const { imgList } = useSelector((state: RootState) => state.image);
  return <GalleryPage imgList={imgList} />;
} 