
import { Switch } from "antd";
import './index.scss'
import { Button, Dropdown,Space} from "antd";
import { DownOutlined} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useState } from "react";


const items:MenuProps['items']=[
    {
        label:'Markdown',
        key:1
    },
    {
        label:'链接',
        key:2
    },
]

const UploadTool = () => {
    const [selectedValue, setSelectedValue] = useState("Markdown");
    const onChange = (checked: boolean)=>{
        console.log(checked);
        
    }

    const handleMenuClick: MenuProps["onClick"] = (e) => {
      console.log("click", e);
      setSelectedValue(e.key==='1'?'Markdown':'链接')
    };

    const menuProps = {
      items,
      onClick: handleMenuClick,
    };
  return (
    <div className="tool-wrapper">
      <div className="utoCopy">
        <Switch
          defaultChecked
          onChange={onChange}
          checkedChildren="自动复制"
          unCheckedChildren="自动复制"
          className="copyButton"
        />
        <Dropdown menu={menuProps}>
          <Button>
            <Space>
              {selectedValue}
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>
      </div>
      <div className="onPress">
        <Switch
          defaultChecked
          onChange={onChange}
          checkedChildren="压缩"
          unCheckedChildren="压缩"
          className="press-switch"
        />
      </div>
    </div>
  );
};
export default UploadTool;
