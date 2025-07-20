import { Button } from 'antd'
import GenerateToken from '../generate-token/index'
import { useState } from 'react'
import logo from '@/assets/logo.svg'
import { DesktopOutlined, BulbOutlined, MoonOutlined } from '@ant-design/icons'
import "./index.scss";

const Header = () => {
    const [show, setShow] = useState(false)
    const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('light')
    
    // 根据主题模式更改背景色
    const changeTheme = (mode: 'system' | 'light' | 'dark') => {
        setThemeMode(mode);
        
        // 直接设置文档背景色
        if (mode === 'light') {
            document.body.style.cssText = 'background-color: #ffffff !important';
        } else if (mode === 'dark') {
            document.body.style.cssText = 'background-color: #312c33 !important';
        } else {
            // 系统主题，根据系统偏好设置
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.style.cssText = `background-color: ${prefersDark ? '#312c33' : '#ffffff'} !important`;
        }
        
        // 同时设置类名，以便可以通过CSS进一步控制样式
        document.documentElement.className = `theme-${mode}`;
    }
    
    return (
      <>
        <div className="header">
          <div className="left">
            <img src={logo} alt="" />
            <h3>源境静态资源管理平台</h3>
          </div>
          <div className="right">
            <Button 
              className={themeMode === 'system' ? 'theme-btn active' : 'theme-btn'}
              icon={<DesktopOutlined />}
              onClick={() => changeTheme('system')}
            />
            <Button 
              className={themeMode === 'light' ? 'theme-btn active' : 'theme-btn'}
              icon={<BulbOutlined />}
              onClick={() => changeTheme('light')}
            />
            <Button 
              className={themeMode === 'dark' ? 'theme-btn active' : 'theme-btn'}
              icon={<MoonOutlined />}
              onClick={() => changeTheme('dark')}
            />
            <Button className="iconfont" onClick={() => setShow(true)}>
              &#xe653;
            </Button>
          </div>
        </div>
        <GenerateToken show={show} setShow={setShow}></GenerateToken>
      </>
    );
}

export default Header