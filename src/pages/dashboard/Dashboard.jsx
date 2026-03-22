import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getDashboardMetrics } from "../../services/dashboardService";
import "./Dashboard.scss";

function Dashboard() {
  const [displayMetrics, setDisplayMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [filter, setFilter] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await getDashboardMetrics(filter.month, filter.year);
        const actualData = res.data?.data || res.data;

        if (isMounted) {
          setDisplayMetrics(actualData);
        }
      } catch (err) {
        console.error("Lỗi:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [filter]);

  const interactionPieData = useMemo(() => {
    if (!displayMetrics) return [];
    return [
      {
        name: "Đã tương tác",
        value: displayMetrics.totalInteractedEnterprises || 0,
      },
      {
        name: "Chưa tương tác",
        value: Math.max(
          0,
          (displayMetrics.totalEnterprises || 0) -
            (displayMetrics.totalInteractedEnterprises || 0),
        ),
      },
    ];
  }, [displayMetrics]);

  if (isLoading || !displayMetrics) {
    return <div className="loading">Đang tải dữ liệu hệ thống...</div>;
  }

  const INTERACTION_COLORS = ["#ffffff", "rgba(255, 255, 255, 0.3)"];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [2023, 2024, 2025, 2026];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="title">Tổng quan hệ thống</h1>
        <p className="subtitle">Báo cáo chỉ số kinh doanh tổng hợp</p>
      </header>

      <div className="main-stats-wrapper">
        <div className="stat-card interaction-card">
          <div className="card-info">
            <label>Tỷ lệ tương tác doanh nghiệp</label>
            <div className="value">
              {displayMetrics.totalInteractedEnterprises || 0}
            </div>
            <div className="sub-label">
              trên tổng số {displayMetrics.totalEnterprises || 0} doanh nghiệp
            </div>
          </div>
          <div className="card-chart">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie
                  data={interactionPieData}
                  innerRadius={50}
                  outerRadius={60}
                  dataKey="value"
                  stroke="none"
                >
                  {interactionPieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={INTERACTION_COLORS[index]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-percentage">
              {displayMetrics.totalEnterprises > 0
                ? Math.round(
                    (displayMetrics.totalInteractedEnterprises /
                      displayMetrics.totalEnterprises) *
                      100,
                  )
                : 0}
              %
            </div>
          </div>
        </div>

        <div className="secondary-stats-grid">
          <div className="mini-card">
            <label>Tổng nhân sự</label>
            <div className="mini-value">{displayMetrics.totalUsers || 0}</div>
          </div>
          <div className="mini-card highlight">
            <label>Tổng nhân viên đã tiếp xúc (T.{filter.month})</label>
            <div className="mini-value">
              {displayMetrics.totalActiveEmployees || 0}
            </div>
          </div>
          <div className="mini-card">
            <label>Tổng doanh nghiệp</label>
            <div className="mini-value">
              {displayMetrics.totalEnterprises || 0}
            </div>
          </div>
          <div className="mini-card">
            <label>Dịch vụ hoạt động</label>
            <div className="mini-value status-active">
              {displayMetrics.activeServices || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="employee-chart-box">
        <div className="chart-header-row">
          <h3 className="section-title">Hiệu suất nhân viên tiếp xúc</h3>
          <div className="filter-group">
            <select
              value={filter.month}
              onChange={(e) =>
                setFilter({ ...filter, month: parseInt(e.target.value) })
              }
              className="filter-select"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
            <select
              value={filter.year}
              onChange={(e) =>
                setFilter({ ...filter, year: parseInt(e.target.value) })
              }
              className="filter-select"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={350} debounce={100}>
            <BarChart
              key={`chart-${displayMetrics.employeeStats?.length || 0}-${filter.month}-${filter.year}`}
              data={displayMetrics.employeeStats || []}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#eee"
              />
              <XAxis
                dataKey="employeeName"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#666", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#666", fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "#f5f5f5" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Bar
                dataKey="interactionCount"
                name="Số lần tiếp xúc"
                fill="#c8102e"
                radius={[6, 6, 0, 0]}
                barSize={45}
                isAnimationActive={true}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
