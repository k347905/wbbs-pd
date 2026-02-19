import { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Divider,
  Upload,
  message,
  Space,
  Table,
  Typography,
} from "antd";
import { UploadOutlined, PlusOutlined, DeleteOutlined, SendOutlined } from "@ant-design/icons";
import type { CheckInput } from "../types";
import { createBatch, uploadCSV } from "../api";

export default function NewCheckPage() {
  const [batchName, setBatchName] = useState("Batch");
  const [checks, setChecks] = useState<CheckInput[]>([]);
  const [form] = Form.useForm<CheckInput>();
  const [loading, setLoading] = useState(false);

  const addCheck = (values: CheckInput) => {
    setChecks([...checks, values]);
    form.resetFields();
  };

  const removeCheck = (index: number) => {
    setChecks(checks.filter((_, i) => i !== index));
  };

  const submitBatch = async () => {
    if (checks.length === 0) {
      message.warning("Добавьте хотя бы одну проверку");
      return;
    }
    setLoading(true);
    try {
      const batch = await createBatch({ name: batchName, checks });
      message.success(`Батч "${batch.name}" создан (${batch.total} проверок)`);
      setChecks([]);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCSV = async (file: File) => {
    setLoading(true);
    try {
      const batch = await uploadCSV(file, batchName || file.name);
      message.success(`CSV загружен: ${batch.total} проверок`);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
    return false; // prevent antd auto-upload
  };

  const columns = [
    { title: "Серия", dataIndex: "series", key: "series" },
    { title: "Номер", dataIndex: "number", key: "number" },
    { title: "Имя", dataIndex: "firstname", key: "firstname" },
    { title: "Фамилия", dataIndex: "lastname", key: "lastname" },
    {
      title: "",
      key: "action",
      render: (_: any, __: any, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeCheck(index)}
        />
      ),
    },
  ];

  return (
    <div>
      <Card title="Новая проверка">
        <Form.Item label="Имя батча" style={{ maxWidth: 400 }}>
          <Input
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
          />
        </Form.Item>

        <Divider>Добавить вручную</Divider>
        <Form form={form} layout="inline" onFinish={addCheck}>
          <Form.Item name="series" rules={[{ required: true, message: "Серия" }]}>
            <Input placeholder="Серия" style={{ width: 100 }} />
          </Form.Item>
          <Form.Item name="number" rules={[{ required: true, message: "Номер" }]}>
            <Input placeholder="Номер" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="firstname" rules={[{ required: true, message: "Имя" }]}>
            <Input placeholder="Имя" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="lastname" rules={[{ required: true, message: "Фамилия" }]}>
            <Input placeholder="Фамилия" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item>
            <Button type="dashed" icon={<PlusOutlined />} htmlType="submit">
              Добавить
            </Button>
          </Form.Item>
        </Form>

        {checks.length > 0 && (
          <>
            <Table
              dataSource={checks.map((c, i) => ({ ...c, key: i }))}
              columns={columns}
              pagination={false}
              size="small"
              style={{ marginTop: 16 }}
            />
            <Space style={{ marginTop: 16 }}>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={loading}
                onClick={submitBatch}
              >
                Отправить батч ({checks.length})
              </Button>
            </Space>
          </>
        )}

        <Divider>Или загрузить CSV</Divider>
        <Upload
          accept=".csv"
          showUploadList={false}
          beforeUpload={handleCSV}
        >
          <Button icon={<UploadOutlined />} loading={loading}>
            Загрузить CSV
          </Button>
        </Upload>
        <Typography.Text type="secondary" style={{ display: "block", marginTop: 8 }}>
          CSV должен содержать колонки: series, number, firstname, lastname
        </Typography.Text>
      </Card>
    </div>
  );
}
