import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getDashboardMetrics } from "../../services/dashboardService";
import styles from "./Dashboard.module.scss";

function Dashboard() {
  const [displayMetrics, setDisplayMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeData, setActiveData] = useState(null);

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

        if (isMounted) setDisplayMetrics(actualData);
      } catch (err) {
        console.error(err);
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
        value:
          (displayMetrics.totalEnterprises || 0) -
          (displayMetrics.totalInteractedEnterprises || 0),
      },
    ];
  }, [displayMetrics]);

  if (isLoading || !displayMetrics) {
    return <div className={styles.loading}>Đang tải dữ liệu...</div>;
  }

  const total = displayMetrics.totalEnterprises || 0;
  const interacted = displayMetrics.totalInteractedEnterprises || 0;
  const percent = total > 0 ? Math.round((interacted / total) * 100) : 0;

  const COLORS = ["#ffffff", "rgba(255,255,255,0.25)"];

  return (
    <div className={styles.dashboardContainer}>

      {/* HEADER */}
      <div className={styles.dashboardHeader}>
        <div className={styles.title}>Tổng quan hệ thống</div>
        <div className={styles.subtitle}>
          Báo cáo chỉ số kinh doanh tổng hợp
        </div>
      </div>

      {/* MAIN STATS */}
      <div className={styles.mainStatsWrapper}>

        {/* CARD CHÍNH */}
        <div className={styles.interactionCard}>
          <div className={styles.cardInfo}>
            <label>Tỷ lệ tương tác doanh nghiệp</label>
            <div className={styles.value}>{interacted}</div>
            <div className={styles.subLabel}>
              trên tổng số {total} doanh nghiệp
            </div>
          </div>

          <div className={styles.cardChart}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={interactionPieData}
                  innerRadius={50}
                  outerRadius={65}
                  dataKey="value"
                  stroke="none"
                >
                  {interactionPieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className={styles.chartPercentage}>
              {percent}%
            </div>
          </div>
        </div>

        {/* MINI CARDS */}
        <div className={styles.secondaryGrid}>
          <div className={styles.miniCard}>
            <label>Tổng nhân sự</label>
            <div className={styles.miniValue}>
              {displayMetrics.totalUsers || 0}
            </div>
          </div>

          <div className={`${styles.miniCard} ${styles.highlight}`}>
            <label>Tổng NV tiếp xúc (T.{filter.month})</label>
            <div className={styles.miniValue}>
              {displayMetrics.totalActiveEmployees || 0}
            </div>
          </div>

          <div className={styles.miniCard}>
            <label>Tổng doanh nghiệp</label>
            <div className={styles.miniValue}>{total}</div>
          </div>

          <div className={styles.miniCard}>
            <label>Dịch vụ hoạt động</label>
            <div className={`${styles.miniValue} ${styles.statusActive}`}>
              {displayMetrics.activeServices || 0}
            </div>
          </div>
        </div>
      </div>

      {/* BAR CHART */}
      <div className={styles.employeeChartBox}>
        <div className={styles.chartHeaderRow}>
          <h3 className={styles.sectionTitle}>
            Hiệu suất nhân viên tiếp xúc
          </h3>

          <div className={styles.filterGroup}>
            <select
              className={styles.filterSelect}
              value={filter.month}
              onChange={(e) =>
                setFilter({ ...filter, month: +e.target.value })
              }
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={filter.year}
              onChange={(e) =>
                setFilter({ ...filter, year: +e.target.value })
              }
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CHART + TOOLTIP WRAPPER */}
        <div style={{ position: "relative" }}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={displayMetrics.employeeStats || []}
              barCategoryGap="60%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis dataKey="employeeName" />
              <YAxis allowDecimals={false} />

              <Bar
                dataKey="interactionCount"
                fill="#c8102e"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
                activeBar={{ fill: "#a50d26" }}
                onMouseEnter={(data, index, e) => {
                  setActiveData({
                    ...data,
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                onMouseLeave={() => setActiveData(null)}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* TOOLTIP */}
          {activeData && (
            <div
              style={{
                position: "fixed",
                top: activeData.y - 60, 
                left: activeData.x,

                transform: "translate(-50%, -100%)",
                background: "#fff",
                padding: "10px 14px",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                fontSize: "13px",
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}
            >
              <div style={{ fontWeight: 600 }}>
                {activeData.payload.employeeName}
              </div>

              <div style={{ color: "#c8102e" }}>
                Số doanh nghiệp đã tiếp xúc: {activeData.value}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;