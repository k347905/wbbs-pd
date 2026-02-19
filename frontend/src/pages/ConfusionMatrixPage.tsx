import { useState, useCallback } from "react";
import { Card, Switch, Statistic, Row, Col, Typography, Spin, Table } from "antd";
import type { ConfusionMatrixData } from "../types";
import { getConfusionMatrix } from "../api";
import { usePolling } from "../hooks/usePolling";

const { Text } = Typography;

export default function ConfusionMatrixPage() {
  const [data, setData] = useState<ConfusionMatrixData | null>(null);
  const [includeEnf, setIncludeEnf] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const d = await getConfusionMatrix(includeEnf);
      setData(d);
    } finally {
      setLoading(false);
    }
  }, [includeEnf]);

  usePolling(fetchData, 10000);

  if (loading || !data) return <Spin />;

  const matrixData = [
    {
      key: "predicted_valid",
      label: "Predicted: Valid",
      actual_valid: data.tp,
      actual_invalid: data.fp,
    },
    {
      key: "predicted_invalid",
      label: "Predicted: Invalid",
      actual_valid: data.fn,
      actual_invalid: data.tn,
    },
  ];

  const matrixColumns = [
    { title: "", dataIndex: "label", key: "label", width: 200 },
    {
      title: "Actual: Valid",
      dataIndex: "actual_valid",
      key: "actual_valid",
      width: 150,
      render: (v: number, record: any) => (
        <Text
          strong
          style={{
            color: record.key === "predicted_valid" ? "#52c41a" : "#ff4d4f",
            fontSize: 20,
          }}
        >
          {v}
        </Text>
      ),
    },
    {
      title: "Actual: Invalid",
      dataIndex: "actual_invalid",
      key: "actual_invalid",
      width: 150,
      render: (v: number, record: any) => (
        <Text
          strong
          style={{
            color: record.key === "predicted_invalid" ? "#52c41a" : "#ff4d4f",
            fontSize: 20,
          }}
        >
          {v}
        </Text>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Confusion Matrix"
        extra={
          <Switch
            checkedChildren="entity_not_found = invalid"
            unCheckedChildren="entity_not_found исключён"
            checked={includeEnf}
            onChange={setIncludeEnf}
          />
        }
      >
        <Table
          dataSource={matrixData}
          columns={matrixColumns}
          pagination={false}
          bordered
          size="middle"
          style={{ maxWidth: 550, marginBottom: 24 }}
        />
        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Statistic title="TP" value={data.tp} valueStyle={{ color: "#52c41a" }} />
          </Col>
          <Col span={4}>
            <Statistic title="TN" value={data.tn} valueStyle={{ color: "#52c41a" }} />
          </Col>
          <Col span={4}>
            <Statistic title="FP" value={data.fp} valueStyle={{ color: "#ff4d4f" }} />
          </Col>
          <Col span={4}>
            <Statistic title="FN" value={data.fn} valueStyle={{ color: "#ff4d4f" }} />
          </Col>
          <Col span={4}>
            <Statistic
              title="entity_not_found"
              value={data.entity_not_found}
              valueStyle={{ color: "#faad14" }}
            />
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={6}>
            <Statistic title="Accuracy" value={data.accuracy} precision={4} />
          </Col>
          <Col span={6}>
            <Statistic title="Precision" value={data.precision_val} precision={4} />
          </Col>
          <Col span={6}>
            <Statistic title="Recall" value={data.recall} precision={4} />
          </Col>
          <Col span={6}>
            <Statistic title="F1" value={data.f1} precision={4} />
          </Col>
        </Row>
        <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
          Всего размеченных: {data.total_labeled}
        </Text>
      </Card>
    </div>
  );
}
