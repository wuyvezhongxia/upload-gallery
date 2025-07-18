import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { DesktopOutlined, BulbOutlined, MoonOutlined, AppstoreOutlined, BarsOutlined } from '@ant-design/icons';
import type { ImageItem } from '@yuanjing/shared';
import ImageListView from '../components/ImageListView';
import ImageGridView from '../components/ImageGridView';

interface ViewToolsProps {
  imgList?: ImageItem[];
}

const themeModes = [
  { key: 'system', icon: <DesktopOutlined /> },
  { key: 'light', icon: <BulbOutlined /> },
  { key: 'dark', icon: <MoonOutlined /> },
];

const viewModes = [
  { key: 'list', icon: <BarsOutlined /> },
  { key: 'grid', icon: <AppstoreOutlined /> },
];

const ViewTools: React.FC<ViewToolsProps> = ({ imgList = [] }) => {
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('light');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // 根据主题模式更改背景色
  useEffect(() => {
    // 直接设置文档背景色，使用!important确保优先级
    if (themeMode === 'light') {
      document.body.setAttribute('style', 'background-color: #ffffff !important');
    } else if (themeMode === 'dark') {
      document.body.setAttribute('style', 'background-color: #1f1f1f !important');
    } else {
      // 系统主题，根据系统偏好设置
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.setAttribute('style', `background-color: ${prefersDark ? '#1f1f1f' : '#ffffff'} !important`);
    }
    
    // 同时设置类名，以便可以通过CSS进一步控制样式
    document.documentElement.className = `theme-${themeMode}`;
  }, [themeMode]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0', padding: '0 20px' }}>
        {/* 左上角的视图切换按钮 */}
        <div>
          {viewModes.map(m => (
            <Button
              key={m.key}
              type={viewMode === m.key ? 'primary' : 'default'}
              icon={m.icon}
              onClick={() => setViewMode(m.key as 'list' | 'grid')}
              style={{ width: 40, height: 32, fontSize: 16 }}
            />
          ))}
        </div>
        
        {/* 右上角的主题切换按钮 */}
        <div>
          {themeModes.map(m => (
            <Button
              key={m.key}
              type={themeMode === m.key ? 'primary' : 'default'}
              icon={m.icon}
              onClick={() => setThemeMode(m.key as 'system' | 'light' | 'dark')}
              style={{ width: 36, height: 36, fontSize: 16 }}
            />
          ))}
        </div>
      </div>

      {/* 根据视图模式显示不同的组件 */}
      <div style={{ padding: '0 20px' }}>
        {viewMode === 'list' ? (
          <ImageListView imgList={imgList} />
        ) : (
          <ImageGridView imgList={imgList} />
        )}
      </div>
    </div>
  );
};

export default ViewTools;