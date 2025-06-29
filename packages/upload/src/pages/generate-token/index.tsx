import { Modal,Button} from "antd";
import {
  SettingFilled,
  RedoOutlined,
  CaretRightOutlined
} from "@ant-design/icons";
import './index.scss'
import { useState } from "react";
import NewToken from './components/newToken'
import TokenKey from "./components/tonkenKey";
const GenerateToken = (props) => {
  const {show,setShow} = props

  // 控制更新token组件是否显示
  const [isShow,setIsShow] = useState(false)

  // 控制密钥是否显示
  const [showKey, setShowKey] = useState(false)

  const handleCancel = ()=>{
    setShow(false)
  }

  const showNewToken = ()=>{
    setIsShow(true)
  }
  const showTokenKey = ()=>{
    setShowKey(true)
    
  }

  return (
    <div>
      <Modal
        title="token信息"
        open={show}
        mask={true}
        onCancel={handleCancel}
        onOk={handleCancel}
        okButtonProps={{ style: { display: "none" } }}
        cancelButtonProps={{ style: { display: "none" } }}
        className="container"
      >
        <p className="valid-period">
          有效期至：
          <span className="time">1-1-1 剩余时间</span>
          <span className="day">天</span>
          <span className="hour">时</span>
          <span className="second">秒</span>
        </p>
        <div className="controllToken">
          <div className="new-token" onClick={showNewToken}>
            <RedoOutlined />
            更新 token
          </div>
          <div className="generate-token" onClick={showTokenKey}>
            <SettingFilled />
            生成 token
          </div>
        </div>
        <TokenKey isShow={showKey} setIsShow={setShowKey}></TokenKey>
        <div className="valid-setting">
          <CaretRightOutlined />
          查看生效配置
        </div>
        <div className="cancel">
          <Button type="primary" onClick={handleCancel}>
            关闭
          </Button>
        </div>
      </Modal>
      <NewToken isShow={isShow} setIsShow={setIsShow}></NewToken>
    </div>
  );
};
export default GenerateToken;
