import { CloudUploadOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import {Upload } from "antd";
import './index.scss'
const {Dragger} = Upload;

// 属性展开语法
const props: UploadProps = {
  name: "file",
  action: "https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload",
  onChange(file){
    console.log(file);
    
  }

};

const UploadFile = () => {

    return (
      <div className="upload-container">
          <textarea
            id="paste-area"
            placeholder="你也可以点击此处，然后粘贴你要上传的图片"
          />

        <Dragger {...props}>
          <p className="ant-upload-drag-icon">
            <CloudUploadOutlined />
          </p>
          <p className="ant-upload-text">
            拖拽文件到这里或<span>点击上传</span>
          </p>
        </Dragger>
      </div>
    );
};
export default UploadFile;
