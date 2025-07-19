import React, { useState, useEffect, useRef } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { Spin } from 'antd';
import ColorThief from 'colorthief';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface ColorLazyImageProps {
  src: string;
  alt: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void; // 修改这里，传递事件对象
  style?: React.CSSProperties;
  wrapperProps?: any;
  threshold?: number;
  delayTime?: number;
  afterLoad?: () => void;
}

const ColorLazyImage: React.FC<ColorLazyImageProps> = ({
  src,
  alt,
  onClick,
  style,
  wrapperProps,
  threshold = 100,
  delayTime = 5000,
  afterLoad,
}) => {
  const [dominantColor, setDominantColor] = useState<string>('#f0f2f5'); // 默认背景色
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // 提前加载小图并提取主色调
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const color = colorThief.getColor(img);
        setDominantColor(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
      } catch (error) {
        console.error('提取颜色失败:', error);
      }
    };
    img.onerror = () => {
      console.error('图片加载失败');
    };
    
    // 添加随机参数避免缓存，确保onload触发
    img.src = `${src}?colorExtract=${Date.now()}`;
  }, [src]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    if (afterLoad) {
      afterLoad();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <LazyLoadImage
        src={src}
        alt={alt}
        effect="blur"
        threshold={threshold}
        delayMethod="debounce"
        delayTime={delayTime}
        afterLoad={handleImageLoad}
        wrapperProps={{
          ...wrapperProps,
          style: {
            ...wrapperProps?.style,
            transition: 'background-color 1.5s ease-in-out',
            backgroundColor: dominantColor,
          }
        }}
        style={{
          ...style,
          opacity: 0,
          transition: 'opacity 1.5s ease-in-out',
          ...(isLoaded ? { opacity: 1 } : {}),
        }}
        onClick={onClick} // 这里会传递事件对象
        placeholder={
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: dominantColor,
            transition: 'background-color 1.5s ease-in-out',
          }}>
            <Spin size="large" />
          </div>
        }
      />
    </div>
  );
};

export default ColorLazyImage;