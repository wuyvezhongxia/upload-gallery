import { Modal} from "antd"

const NewToken= (props) => {
  const { isShow, setIsShow } = props;
  console.log(isShow);
  const onCancel = () => {
    setIsShow(false);
  };
  const onOk = () => {
    setIsShow(false);
  };
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
          type="text"
        />
      </Modal>
    </div>
  );
};
export default NewToken;
