import { Button, Form, Input, Radio, Checkbox, DatePicker } from "antd";

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
    console.log('11111',form);
    

    const onFinish = (values: any) => {
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
            save: true,
          }}
          style={{ width:'100%', marginTop: "25px" }}
          scrollToFirstError
          colon={false}
        >
          <Form.Item name="storage-service" label="存储服务">
            <Radio.Group>
              <Radio>七牛云</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="access-key" label="Access Key" rules={[]}>
            <Input placeholder="请输入七牛云 Access Key" />
          </Form.Item>

          <Form.Item
            name="secret-key"
            label="Secret Key"
            rules={[]}
            hasFeedback
          >
            <Input.Password placeholder="请输入七牛云 Secret Key" />
          </Form.Item>

          <Form.Item name="bucket" label="Bucket" rules={[]}>
            <Input placeholder="七牛云 kodo 存储空间名称" />
          </Form.Item>

          <Form.Item name="domain" label="域名" rules={[{}]}>
            <Input placeholder="访问域名： https://example.com" />
          </Form.Item>
          <Form.Item name="form-prefix" label="资源前缀" rules={[]}>
            <Input placeholder="请输入资源前缀" />
          </Form.Item>

          <Form.Item name="scope" label="资源Scope" rules={[]}>
            <Input placeholder="请输入资源 scope" />
          </Form.Item>
          <Form.Item name="link" label="资源链接" rules={[]}>
            <span>///</span>
          </Form.Item>

          <Form.Item name="date-picker" label="过期时间">
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
