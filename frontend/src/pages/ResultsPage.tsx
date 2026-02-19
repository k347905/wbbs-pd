import { useState, useCallback } from "react";
import { Card, Table, Tag, Select, Space, Button, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import type { CheckRead, BatchRead } from "../types";
import { listResults, listBatches, updateLabel } from "../api";
import { usePolling } from "../hooks/usePolling";

const statusColors: Record<string, string> = {
  pending: "default",
  processing: "processing",
  completed: "success",
  error: "error",
};

const resultColors: Record<string, string> = {
  valid: "green",
  invalid: "red",
  entity_not_found: "orange",
};

export default function ResultsPage() {
  const [results, setResults] = useState<CheckRead[]>([]);
  const [batches, setBatches] = useState<BatchRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [r, b] = await Promise.all([listResults(filters), listBatches()]);
      setResults(r);
      setBatches(b);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  usePolling(fetchData, 5000);

  const handleLabel = async (checkId: number, label: string) => {
    try {
      await updateLabel(checkId, label);
      setResults((prev) =>
        prev.map((r) => (r.id === checkId ? { ...r, actual_label: label } : r))
      );
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
    },
    {
      title: "Батч",
      dataIndex: "batch_name",
      key: "batch_name",
      width: 120,
    },
    {
      title: "Серия",
      dataIndex: "series_obfuscated",
      key: "series",
      width: 80,
    },
    {
      title: "Номер",
      dataIndex: "number_obfuscated",
      key: "number",
      width: 100,
    },
    {
      title: "Имя",
      dataIndex: "firstname_obfuscated",
      key: "firstname",
      width: 80,
    },
    {
      title: "Фамилия",
      dataIndex: "lastname_obfuscated",
      key: "lastname",
      width: 80,
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    {
      title: "Результат API",
      dataIndex: "api_result_status",
      key: "api_result_status",
      width: 130,
      render: (s: string | null) =>
        s ? <Tag color={resultColors[s]}>{s}</Tag> : "—",
    },
    {
      title: "Время (мс)",
      dataIndex: "duration_ms",
      key: "duration_ms",
      width: 100,
      render: (v: number | null) => (v !== null ? v.toLocaleString() : "—"),
    },
    {
      title: "Разметка",
      key: "actual_label",
      width: 200,
      render: (_: any, record: CheckRead) => {
        if (record.status !== "completed") return "—";
        return (
          <Space>
            <Button
              size="small"
              type={record.actual_label === "valid" ? "primary" : "default"}
              style={record.actual_label === "valid" ? { background: "#52c41a", borderColor: "#52c41a" } : {}}
              onClick={() => handleLabel(record.id, "valid")}
            >
              Valid
            </Button>
            <Button
              size="small"
              type={record.actual_label === "invalid" ? "primary" : "default"}
              danger={record.actual_label === "invalid"}
              onClick={() => handleLabel(record.id, "invalid")}
            >
              Invalid
            </Button>
          </Space>
        );
      },
    },
    {
      title: "Ошибка",
      dataIndex: "error_message",
      key: "error_message",
      width: 200,
      ellipsis: true,
      render: (v: string | null) => (v ? <Tag color="red">{v}</Tag> : ""),
    },
  ];

  return (
    <Card
      title="Результаты проверок"
      extra={
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
          Обновить
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="Батч"
          allowClear
          style={{ width: 200 }}
          onChange={(v) =>
            setFilters((f) => {
              const nf = { ...f };
              if (v) nf.batch_id = String(v);
              else delete nf.batch_id;
              return nf;
            })
          }
          options={batches.map((b) => ({
            label: `${b.name} (${b.completed}/${b.total})`,
            value: b.id,
          }))}
        />
        <Select
          placeholder="Статус"
          allowClear
          style={{ width: 150 }}
          onChange={(v) =>
            setFilters((f) => {
              const nf = { ...f };
              if (v) nf.status = v;
              else delete nf.status;
              return nf;
            })
          }
          options={[
            { label: "pending", value: "pending" },
            { label: "processing", value: "processing" },
            { label: "completed", value: "completed" },
            { label: "error", value: "error" },
          ]}
        />
        <Select
          placeholder="Результат API"
          allowClear
          style={{ width: 180 }}
          onChange={(v) =>
            setFilters((f) => {
              const nf = { ...f };
              if (v) nf.api_result_status = v;
              else delete nf.api_result_status;
              return nf;
            })
          }
          options={[
            { label: "valid", value: "valid" },
            { label: "invalid", value: "invalid" },
            { label: "entity_not_found", value: "entity_not_found" },
          ]}
        />
        <Select
          placeholder="Разметка"
          allowClear
          style={{ width: 150 }}
          onChange={(v) =>
            setFilters((f) => {
              const nf = { ...f };
              if (v) nf.actual_label = v;
              else delete nf.actual_label;
              return nf;
            })
          }
          options={[
            { label: "valid", value: "valid" },
            { label: "invalid", value: "invalid" },
            { label: "Без разметки", value: "null" },
          ]}
        />
      </Space>
      <Table
        dataSource={results}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 50 }}
      />
    </Card>
  );
}
