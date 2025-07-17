import { createSlice } from "@reduxjs/toolkit";

export interface ImageItem {
  id: number;
  url: string;
  name: string;
  date: number; // 改为必需字段，存储上传时间戳
  size: number;
  originSize?: number;
}

export type ImageState = {
  imgList: ImageItem[];
};

// 获取七天前的时间戳
const getSevenDaysAgo = () => {
  return Date.now() - (7 * 24 * 60 * 60 * 1000);
};

// 过滤七天内的图片
const filterRecentImages = (images: ImageItem[]): ImageItem[] => {
  const sevenDaysAgo = getSevenDaysAgo();
  return images.filter(img => img.date > sevenDaysAgo);
};

// 从 localStorage 加载并过滤七天内的图片
const loadRecentImages = (): ImageItem[] => {
  try {
    const stored = localStorage.getItem('upload-image');
    const allImages = stored ? JSON.parse(stored) : [];
    const recentImages = filterRecentImages(allImages);
    
    // 如果过滤后的数据与原数据不同，更新 localStorage
    if (recentImages.length !== allImages.length) {
      localStorage.setItem('upload-image', JSON.stringify(recentImages));
    }
    return recentImages;
  } catch {
    return [];
  }
};

const imageStore = createSlice({
  name: "imageStore",
  initialState: {
    imgList: loadRecentImages()
  },
  reducers: {
    addImage: (state, action) => {
      // 确保新图片有时间戳
      const newImage = {
        ...action.payload,
        date: action.payload.date || Date.now()
      };
      
      state.imgList.unshift(newImage);
      
      // 过滤七天内的图片
      state.imgList = filterRecentImages(state.imgList);
      
      // 保存到 localStorage
      localStorage.setItem(
        'upload-image', 
        JSON.stringify(state.imgList, (key, value) => (key === 'file' ? undefined : value))
      );
    },
    
    // 手动清理过期图片
    cleanExpiredImages: (state) => {
      state.imgList = filterRecentImages(state.imgList);
      localStorage.setItem('upload-image', JSON.stringify(state.imgList));
    },
    
    // 刷新图片列表（重新从 localStorage 加载并过滤）
    refreshImages: (state) => {
      state.imgList = loadRecentImages();
    }
  },
});

export const { addImage, cleanExpiredImages, refreshImages } = imageStore.actions;
export default imageStore.reducer; 