import {
  Button,
  Form,
  Input,
  Radio,
  Checkbox,
  DatePicker,
  message
} from "antd";
import { useState } from "react";
import { generateUploadToken } from "../../../utils/qiniu";
import { parseToken } from "@yuanjing/shared";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";
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
  link?: string | undefined
};

type TokenKeyProps = {
  isShow: boolean;
  setIsShow: (value: boolean) => void;
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
  
const TokenKey = (props:TokenKeyProps) => {
    const dispatch = useDispatch()
    const { isShow, setIsShow } = props;
    const [form] = Form.useForm();
    const [formValue,setFormValue]=useState(()=>{
      const savedValues = localStorage.getItem('config');
      if (savedValues) {
        const parsed = JSON.parse(savedValues);
        return {
          ...parsed,
          dateExpired: parsed.dateExpired ? dayjs(parsed.dateExpired) : null,
        };
      }
      return {
            "storage-service": "七牛云",
            accessKey: "",
            secretKey: "",
            bucket: "",
            domain: "",
            formPrefix: "",
            save: true,
            scope: "default",
            dateExpired: null,
          };
    })

    const onChange = (_changedValues:FormValues, allValues:FormValues) => {
      setFormValue(allValues);
    };

    const onFinish = async (values: FormValues) => {
      try{
        const token = await generateUploadToken({
          accessKey: values.accessKey,
          secretKey: values.secretKey,
          bucket: values.bucket,
          prefix: values.formPrefix,
          domain: values.domain,
          scope: values.scope,
          expires: values.dateExpired ? dayjs(values.dateExpired).valueOf() : Date.now(),
        });
        if(!token){
          message.error('生成token失败')
        };
        dispatch(parseToken(token))
        setFormValue(values)
        localStorage.setItem('config',JSON.stringify(values))
        message.success('token生成')
      }catch(error){
        message.error(`操作失败:${error}`)
      }
    };
    
    const validateSecretKey = (_:object, value: string) => {
      const accessKey = form.getFieldValue("accessKey");
      if (value && value === accessKey) {
        return Promise.reject(new Error("Access Key 和 Secret Key 不能相同"));
      }
      return Promise.resolve();
    };
  return (
    <div>
      {isShow && (
        <Form
          {...formItemLayout}
          form={form}
          name="register"
          onFinish={onFinish}
          initialValues={formValue}
          style={{ width: "100%", marginTop: "25px" }}
          scrollToFirstError={true}
          colon={false}
          onValuesChange={onChange}
        >
          <Form.Item name="storage-service" label="存储服务">
            <Radio.Group>
              <Radio value="七牛云">七牛云</Radio>
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
                message: "请输入七牛云 Secret Key",
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
                pattern: /^(http?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i,
                message: "请输入有效的域名格式 (如: http://example.com)",
              },
            ]}
          >
            <Input placeholder="访问域名： http://example.com" />
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
              value={formValue.dateExpired}
              onChange={(date) => {
                form.setFieldsValue({ dateExpired: date });
              }}
            />
          </Form.Item>

          <Form.Item
            name="save"
            valuePropName="checked"
            wrapperCol={{
              xs: { span: 24 },
              sm: { span: 16, offset: 9 },
            }}
          >
            <Checkbox style={{ lineHeight: "32px" }} defaultChecked={true}>
              保存本地帐号
            </Checkbox>
          </Form.Item>

          <Form.Item
            wrapperCol={{
              xs: { span: 24, offset: 0 },
              sm: { span: 16, offset: 8 },
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
