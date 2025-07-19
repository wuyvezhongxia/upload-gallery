import { Button, Dropdown, Space, Switch } from "antd";
import { DownOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useState, useEffect } from "react";
import "./index.scss";
import { useUploadConfig } from "@/Hooks/upload";

const items: MenuProps["items"] = [
  {
    label: "Markdown",
    key: 1,
  },
  {
    label: "链接",
    key: 2,
  },
];

const UploadTool = () => {
  const [selectedValue, setSelectedValue] = useState<"Markdown" | "链接">(
    "Markdown"
  );
  const [autoCopy, setAutoCopy] = useState(true);
  const [compress, setCompress] = useState(true);
  const { config, updateConfig } = useUploadConfig();

  useEffect(() => {
    setAutoCopy(config.autoCopy);
    setCompress(config.compressImage);
    setSelectedValue(config.copyType);
  }, [config]);

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    const newCopyType = e.key === "1" ? "Markdown" : "链接";
    setSelectedValue(newCopyType);
    updateConfig({ copyType: newCopyType });
  };

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  const handleCompressChange = (checked: boolean) => {
    setCompress(checked);
    updateConfig({ compressImage: checked });
  };

  const handleAutoCopyChange = (checked: boolean) => {
    setAutoCopy(checked);
    updateConfig({ autoCopy: checked });
  };

  return (
    <div className="tool-wrapper">
      <div className="autoCopy">
        <Switch
          checked={autoCopy}
          onChange={handleAutoCopyChange}
          checkedChildren="自动复制"
          unCheckedChildren="手动复制"
          className="copyButton"
        />
        {autoCopy && (
          <Dropdown menu={menuProps}>
            <Button>
              <Space>
                {selectedValue}
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
        )}
      </div>
      <div className="compress">
        <Switch
          checked={compress}
          onChange={handleCompressChange}
          checkedChildren="压缩"
          unCheckedChildren="原图"
          className="press-switch"
        />
      </div>
    </div>
  );
};

export default UploadTool;
