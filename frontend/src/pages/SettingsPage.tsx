import { useEffect, useState } from "react";
import { Form, Input, InputNumber, Button, Card, message, Spin } from "antd";
import type { Settings } from "../types";
import { getSettings, updateSettings } from "../api";

export default function SettingsPage() {
  const [form] = Form.useForm<Settings>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      form.setFieldsValue(s);
      setLoading(false);
    });
  }, [form]);

  const onFinish = async (values: Settings) => {
    try {
      await updateSettings(values);
      message.success("Настройки сохранены");
    } catch (e: any) {
      message.error(e.message);
    }
  };

  if (loading) return <Spin />;

  return (
    <Card title="Настройки API">
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 600 }}>
        <Form.Item name="api_base_url" label="API Base URL" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="service_name" label="Service Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="client_id" label="Client ID" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="client_secret" label="Client Secret" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item name="poll_interval_sec" label="Poll Interval (сек)">
          <InputNumber min={1} max={60} />
        </Form.Item>
        <Form.Item name="poll_timeout_sec" label="Poll Timeout (сек)">
          <InputNumber min={10} max={600} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Сохранить
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
