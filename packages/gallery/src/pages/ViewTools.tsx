import React, { useState } from 'react';
import { Button } from 'antd';
import { DesktopOutlined, BulbOutlined, MoonOutlined, AppstoreOutlined, BarsOutlined } from '@ant-design/icons';
import type { ImageItem } from '@yuanjing/shared';

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

const ViewTools: React.FC<ViewToolsProps> = () => {
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('light');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  return (
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
  );
};

export default ViewTools;