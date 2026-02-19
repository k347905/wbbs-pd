import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu } from "antd";
import {
  SettingOutlined,
  PlusCircleOutlined,
  TableOutlined,
  BarChartOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import SettingsPage from "./pages/SettingsPage";
import NewCheckPage from "./pages/NewCheckPage";
import ResultsPage from "./pages/ResultsPage";
import ConfusionMatrixPage from "./pages/ConfusionMatrixPage";
import LogsPage from "./pages/LogsPage";

const { Sider, Content } = Layout;

const menuItems = [
  { key: "/new-check", icon: <PlusCircleOutlined />, label: "Новая проверка" },
  { key: "/results", icon: <TableOutlined />, label: "Результаты" },
  { key: "/confusion-matrix", icon: <BarChartOutlined />, label: "Confusion Matrix" },
  { key: "/logs", icon: <FileTextOutlined />, label: "Логи" },
  { key: "/settings", icon: <SettingOutlined />, label: "Настройки" },
];

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider breakpoint="lg" collapsedWidth={60}>
        <div style={{ color: "#fff", padding: "16px", fontWeight: 600, fontSize: 14, textAlign: "center" }}>
          Passport Eval
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Content style={{ margin: 16 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/new-check" replace />} />
            <Route path="/new-check" element={<NewCheckPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/confusion-matrix" element={<ConfusionMatrixPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
