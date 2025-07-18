import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import GenerateToken from '../generate-token/index'
import {useState} from 'react'
import logo from '@/assets/logo.svg'
import "./index.scss";

const Header = ()=>{
    const [show,setShow] = useState(false) 
    const navigate = useNavigate();
    return (
      <>
        <div className="header">
          <div className="left">
            <img src={logo} alt="" />
            <h3>源境静态资源管理平台</h3>
          </div>
          <div className="right">
            <Button 
              className="gallery-btn"
              onClick={() => navigate('/gallery')}
              style={{ marginRight: 8 }}
            >
              画廊
            </Button>
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