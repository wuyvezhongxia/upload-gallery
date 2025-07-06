import { Modal,Button} from "antd";
import {
  SettingFilled,
  RedoOutlined,
  CaretRightOutlined,
  CaretDownOutlined
} from "@ant-design/icons";
import './index.scss'
import { useEffect, useState } from "react";
import NewToken from './components/newToken'
import TokenKey from "./components/tokenKey"
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

type GenerateTokenProps = {
  show: boolean;
  setShow: (value:boolean) => void
}

const GenerateToken = (props:GenerateTokenProps) => {
  const {show,setShow} = props
  const [isShow,setIsShow] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [remainingTime, setRemainingTime] = useState("");
  const {qiniu}  = useSelector((state:RootState)=>state.config)

  useEffect(()=>{
    if(qiniu.date){
      const expired = dayjs(qiniu.date);
      const calculateTime = ()=>{
        const now = dayjs();
        const diff = expired.diff(now, "second");
        if (diff <= 0) {
          setRemainingTime("已过期");
          clearInterval(interval);
          return;
        }
        const days = Math.floor(diff / (3600 * 24));
        const hours = Math.floor((diff % (3600 * 24)) / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setRemainingTime(`${days}天${hours}时${minutes}分${seconds}秒`);
      }
      const interval = setInterval(calculateTime,1000)
      return () => clearInterval(interval);
    }
    
  },[qiniu.date])
  

  const handleCancel = ()=>{
    setShow(false)
  }

  const showNewToken = ()=>{
    setIsShow(true)
  }
  const showTokenKey = ()=>{
    setShowKey(true)
  }

  const [isValidate,setIsValidate] = useState(false)
  const viewValidateConfig = ()=>{
    setIsValidate(!isValidate)
  }

  const config = ()=>{
    return `${JSON.stringify(qiniu,(key:string,value:string)=>{
      if(key==='token'){
        return
      }
      if(key==='date'){
        return dayjs(value).format('YYYY-MM-DD hh:mm:ss')
      }
      return value
    },2)}`
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
          <span className="time">
            {dayjs(qiniu.date).format("YYYY-MM-DD")}, 剩余时间{" "}
            {remainingTime}
          </span>
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
        <div className="valid-setting" onClick={viewValidateConfig}>
          {isValidate ? <CaretDownOutlined /> : <CaretRightOutlined />}
          查看生效配置
          {isValidate && (<pre
          className="config-json"
          >
            {config()}
          </pre>)}
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
