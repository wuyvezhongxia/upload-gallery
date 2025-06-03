import './index.scss'
import { Button } from 'antd'
import '../../assets/logo.svg'
import GenerateToken from '../generate-token/index'
import {useState} from 'react'
const Header = ()=>{
    const [show,setShow] = useState(false) 
    return (
      <>
        <div className="header">
          <div className="left">
            <img src="/assets/logo.svg" alt="" />
            <h3>源境静态资源管理平台</h3>
          </div>
          <Button className="right iconfont" onClick={()=>setShow(true)}>&#xe653;</Button>
        </div>
        <GenerateToken show={show} setShow={setShow}> </GenerateToken>
      </>
    );
}

export default Header