import { Modal} from "antd"
import { parseToken } from "@yuanjing/shared";
import { useDispatch} from "react-redux";
import { useEffect, useState ,useRef} from "react";
import type { ChangeEvent} from "react";
type newTokenProps = {
  isShow: boolean;
  setIsShow: (value: boolean) => void;
};
const NewToken= (props:newTokenProps) => {
  const { isShow, setIsShow } = props;
  const [inputValue,setInputValue] = useState('')
  const dispatch = useDispatch()
  const inputRef = useRef<HTMLInputElement>(null)
  
  const onCancel = () => {
    setIsShow(false);
  };
  const onOk = () => {
    if(inputValue){
      dispatch(parseToken(inputValue))
    }
    setIsShow(false);
    setInputValue('')
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };
  useEffect(()=>{
    if(isShow){
      inputRef.current?.focus()
    }
  })
  return (
    <div>
      <Modal
        title="设置Token"
        open={isShow}
        mask={true}
        onCancel={onCancel}
        onOk={onOk}
        style={{ marginTop: "100px" }}
      >
        <p style={{ 
            fontSize: "16px", 
            color: "#606266",
            marginBottom:'10px' }}>请粘贴新的token</p>
        <input
          style={{
            width: "100%",
            height: "32px",
            border: "1px solid #ccc",
            paddingLeft:'10px',
            fontSize:'16px',
            borderRadius:'5px'
          }}
          value={inputValue}
          type="text"
          onChange={handleChange}
          ref={inputRef}
        />
      </Modal>
    </div>
  );
};
export default NewToken;
  
