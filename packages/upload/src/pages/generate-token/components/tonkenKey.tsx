import {
  Button,
  Form,
  Input,
  Radio,
  Checkbox,
  DatePicker,
  message,
} from "antd";
import { useEffect, useState } from "react";


// 定义表单值的类型
type FormValues = {
  "storage-service": string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  domain: string;
  formPrefix: string;
  scope: string;
  dateExpired: Date | null;
  save: boolean;
};

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};
  
const TokenKey = (props) => {
    const { isShow, setIsShow } = props;

    const [form] = Form.useForm();
    const [formValue, setFormValue] = useState({
      "storage-service": "七牛云",
      accessKey: "",
      secretKey: "",
      bucket: "",
      domain: "",
      formPrefix: "",
      save: true,
      scope: "default",
      dateExpired: null
    });

    const validateSecretKey = (_, value:string)=>{
      const accessKey = form.getFieldValue('accessKey');
      if(value && value === accessKey){
        console.log(value);
        return Promise.reject(new Error("Access Key 和 Secret Key 不能相同"));
      }
      return Promise.resolve();
    }
    const onChange = (changedValues, allValues) => {
      setFormValue(allValues);
      // setFormValue((prev) => ({ ...prev, ...allValues }));
      console.log(formValue);
    };

    const onFinish = (values: object) => {
      // 获取所有的字段名
      console.log(111);
      
      console.log('Received values of form: ', values);
    };
 

  return (
    <div>
      {isShow && (
        <Form
          {...formItemLayout}
          form={form}
          name="register"
          onFinish={onFinish}
          initialValues={{
            accessKey: "",
            secretKey: "",
            bucket: "",
            domain: "",
            formPrefix: "",
            save: true,
            scope: "",
            dateExpired: null,
          }}
          style={{ width: "100%", marginTop: "25px" }}
          scrollToFirstError={true}
          colon={false}
          onValuesChange={onChange}
        >
          <Form.Item name="storage-service" label="存储服务">
            <Radio.Group>
              <Radio>七牛云</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="accessKey"
            label="Access Key"
            rules={[
              {
                required: true,
                message: "请输入七牛云 Access Key",
              },
            ]}
          >
            <Input placeholder="请输入七牛云 Access Key" />
          </Form.Item>

          <Form.Item
            name="secretKey"
            label="Secret Key"
            rules={[
              {
                required: true,
                message: "请输入七牛云 Access Key",
              },
              {
                validator: validateSecretKey,
              },
            ]}
            hasFeedback
          >
            <Input.Password placeholder="请输入七牛云 Secret Key" />
          </Form.Item>

          <Form.Item
            name="bucket"
            label="Bucket"
            rules={[
              {
                required: true,
                message: "请输入七牛云的存储空间名称",
              },
            ]}
          >
            <Input placeholder="七牛云 kodo 存储空间名称" />
          </Form.Item>

          <Form.Item
            name="domain"
            label="域名"
            rules={[
              {
                required: true,
                message: "请输入访问域名",
              },
              {
                pattern: /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i,
                message: "请输入有效的域名格式 (如: https://example.com)",
              },
            ]}
          >
            <Input placeholder="访问域名： https://example.com" />
          </Form.Item>

          <Form.Item
            name="formPrefix"
            label="资源前缀"
            rules={[
              {
                required: true,
                message: "请输入资源前缀",
              },
            ]}
          >
            <Input placeholder="请输入资源前缀" />
          </Form.Item>

          <Form.Item
            name="scope"
            label="资源Scope"
            rules={[
              {
                required: true,
                message: "请输入资源 scope",
              },
            ]}
          >
            <Input placeholder="请输入资源 scope" />
          </Form.Item>

          <Form.Item name="link" label="资源链接">
            <span style={{ color: "red" }}>
              {`${formValue.domain}/${formValue.formPrefix}/${formValue.scope}/` +
                "${name}"}
            </span>
          </Form.Item>

          <Form.Item
            name="dateExpired"
            label="过期时间"
            rules={[
              {
                required: true,
                message: "请选择过期时间",
              },
            ]}
          >
            <DatePicker
              style={{ width: "80%" }}
              placeholder="选择 token 过期时间"
            />
          </Form.Item>

          <Form.Item
            name="save"
            valuePropName="checked"
            wrapperCol={{
              xs: { span: 24 },
              sm: { span: 16, offset: 9 }, // 添加偏移量实现居中
            }}
          >
            <Checkbox style={{ lineHeight: "32px" }} defaultChecked={true}>
              保存本地帐号
            </Checkbox>
          </Form.Item>

          <Form.Item
            wrapperCol={{
              xs: { span: 24, offset: 0 },
              sm: { span: 16, offset: 8 }, // 添加偏移量实现居中
            }}
          >
            <Button type="primary" htmlType="submit">
              生成并应用
            </Button>
            <Button
              onClick={() => setIsShow(false)}
              style={{ marginLeft: "20px" }}
            >
              取消
            </Button>
          </Form.Item>
        </Form>
      )}
    </div>
  );
};
export default TokenKey;
