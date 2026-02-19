import { useState, useCallback } from "react";
import {
  Card,
  Table,
  Tag,
  Input,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  Typography,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import type { LogEntry, TimingStats } from "../types";
import { listLogs, getTimingStats } from "../api";
import { usePolling } from "../hooks/usePolling";

function FormatBody({ body }: { body: string }) {
  try {
    const parsed = JSON.parse(body);
    return (
      <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  } catch {
    return <Typography.Text code>{body}</Typography.Text>;
  }
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [timing, setTiming] = useState<TimingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkIdFilter, setCheckIdFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (checkIdFilter) params.check_id = checkIdFilter;
      const [l, t] = await Promise.all([listLogs(params), getTimingStats()]);
      setLogs(l);
      setTiming(t);
    } finally {
      setLoading(false);
    }
  }, [checkIdFilter]);

  usePolling(fetchData, 10000);

  const directionColors: Record<string, string> = {
    request: "blue",
    response_create: "cyan",
    response_poll: "green",
    error: "red",
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "Check ID", dataIndex: "check_id", key: "check_id", width: 90 },
    {
      title: "Направление",
      dataIndex: "direction",
      key: "direction",
      width: 150,
      render: (d: string) => (
        <Tag color={directionColors[d] || "default"}>{d}</Tag>
      ),
    },
    {
      title: "Body",
      dataIndex: "body",
      key: "body",
      render: (b: string) => <FormatBody body={b} />,
    },
    {
      title: "Время",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (t: string) => new Date(t).toLocaleString(),
    },
  ];

  return (
    <div>
      {timing && (
        <Card title="Статистика тайминга" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={4}>
              <Statistic title="Среднее (мс)" value={timing.avg_ms} precision={0} />
            </Col>
            <Col span={4}>
              <Statistic title="Мин (мс)" value={timing.min_ms} />
            </Col>
            <Col span={4}>
              <Statistic title="Макс (мс)" value={timing.max_ms} />
            </Col>
            <Col span={4}>
              <Statistic title="P50 (мс)" value={timing.p50_ms} precision={0} />
            </Col>
            <Col span={4}>
              <Statistic title="P95 (мс)" value={timing.p95_ms} precision={0} />
            </Col>
            <Col span={4}>
              <Statistic title="Всего" value={timing.total_completed} />
            </Col>
          </Row>
        </Card>
      )}
      <Card
        title="API логи"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            Обновить
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Check ID"
            value={checkIdFilter}
            onChange={(e) => setCheckIdFilter(e.target.value)}
            style={{ width: 120 }}
            onPressEnter={fetchData}
          />
        </Space>
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{ pageSize: 50 }}
        />
      </Card>
    </div>
  );
}
