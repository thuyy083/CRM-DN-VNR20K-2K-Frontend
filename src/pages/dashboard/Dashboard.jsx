import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import {
  Users,
  TrendingUp,
  Briefcase,
  Calendar,
  AlertCircle,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { getDashboardMetrics } from "../../services/dashboardService";
import styles from "./Dashboard.module.scss";

/* ─── Appointment type labels ─── */
const APPOINTMENT_TYPE_LABEL = {
  EMAIL_QUOTE: "Gửi báo giá",
  CONTRACT_SIGNING: "Ký hợp đồng",
  PHONE_CALL: "Gọi điện",
  DIRECT_VISIT: "Gặp trực tiếp",
  DEMO: "Demo sản phẩm",
  FOLLOW_UP: "Theo dõi",
  CONSULTATION: "Tư vấn",
  NEGOTIATION: "Đàm phán",
};
const getTypeLabel = (type) => APPOINTMENT_TYPE_LABEL[type] ?? type ?? "";

/* ─── Format helpers ─── */
const formatTime = (scheduledTime) => {
  if (!scheduledTime) return "--:--";
  if (Array.isArray(scheduledTime)) {
    const [, , , h = 0, m = 0] = scheduledTime;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const d = new Date(scheduledTime);
  if (isNaN(d)) return "--:--";
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
};

/* ─────────────────────────────────────────────────────────────────────────────
   DeltaBadge — Silicon Valley / Enterprise style
   ─────────────────────────────────────────────────────────────────────────── */
const DeltaBadge = ({ current, previous, invertColor = false }) => {
  if (previous == null) return null;

  const diff = current - previous;
  const pct =
    previous === 0
      ? diff !== 0
        ? 100
        : 0
      : Math.abs(Math.round((diff / previous) * 100));

  if (diff > 0) {
    return (
      <span
        className={`${styles.deltaBadge} ${invertColor ? styles.deltaUpInvert : styles.deltaUp}`}
      >
        <ArrowUpRight size={11} strokeWidth={2.5} />+{diff}&nbsp;·&nbsp;{pct}
        %&nbsp;
        <span className={styles.deltaSuffix}>vs tháng trước</span>
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span
        className={`${styles.deltaBadge} ${invertColor ? styles.deltaDownInvert : styles.deltaDown}`}
      >
        <ArrowDownRight size={11} strokeWidth={2.5} />
        {diff}&nbsp;·&nbsp;{pct}%&nbsp;
        <span className={styles.deltaSuffix}>vs tháng trước</span>
      </span>
    );
  }
  return (
    <span className={`${styles.deltaBadge} ${styles.deltaFlat}`}>
      <Minus size={11} strokeWidth={2.5} />
      Không đổi&nbsp;<span className={styles.deltaSuffix}>vs tháng trước</span>
    </span>
  );
};

/* ─── Tooltips ─── */
const BarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className={styles.barTooltip}>
      <span className={styles.barTooltipName}>{d.employeeName}</span>
      <span className={styles.barTooltipVal}>
        {d.interactionCount} doanh nghiệp
      </span>
    </div>
  );
};

const RegionTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className={styles.barTooltip}>
      <span className={styles.barTooltipName}>{d.region}</span>
      <span className={styles.barTooltipVal}>
        Tổng: {d.totalEnterprises} DN
      </span>
      <span className={styles.barTooltipSub}>
        Đã tiếp xúc: {d.contacted} DN
      </span>
      <span className={styles.barTooltipSub}>
        Chưa tiếp xúc: {d.notContacted} DN
      </span>
    </div>
  );
};

/* ─── Trend Tooltip ─── */
const TrendTooltip = ({ active, payload, label, month }) => {
  if (!active || !payload?.length) return null;
  const cur = payload.find((p) => p.dataKey === "cumContacted");
  const prev = payload.find((p) => p.dataKey === "cumPrev");
  const diff = (cur?.value ?? 0) - (prev?.value ?? 0);
  return (
    <div className={styles.trendTooltip}>
      <span className={styles.trendTooltipDay}>
        Ngày {label} tháng {month}
      </span>
      <div className={styles.trendTooltipRow}>
        <span style={{ color: "#c8102e" }}>Tháng {month}</span>
        <strong>{cur?.value ?? 0} DN</strong>
      </div>
      <div className={styles.trendTooltipRow}>
        <span style={{ color: "#94a3b8" }}>Tháng trước</span>
        <strong>{prev?.value ?? 0} DN</strong>
      </div>
      <div className={`${styles.trendTooltipRow} ${styles.trendTooltipDiff}`}>
        <span>Chênh lệch</span>
        <strong style={{ color: diff >= 0 ? "#16a34a" : "#c8102e" }}>
          {diff >= 0 ? "+" : ""}
          {diff} DN
        </strong>
      </div>
    </div>
  );
};

/* ─── Main component ─── */
function Dashboard() {
  const [displayMetrics, setDisplayMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
        console.error("Dashboard error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [filter]);

  /* ── Derived data ── */
  const interactionPct = useMemo(() => {
    if (!displayMetrics?.totalEnterprises) return 0;
    return Math.round(
      (displayMetrics.totalInteractedEnterprises /
        displayMetrics.totalEnterprises) *
        100,
    );
  }, [displayMetrics]);

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

  const weeklyAppointments = useMemo(() => {
    if (!displayMetrics?.weeklyCalendar?.length) return [];
    return displayMetrics.weeklyCalendar.flatMap((day) =>
      (day.appointments || []).map((app) => ({
        ...app,
        _dayLabel: day.dayOfWeek,
        _date: day.date,
      })),
    );
  }, [displayMetrics]);

  /* ── Trend summary stats ── */
  const trendStats = useMemo(() => {
    const trend = displayMetrics?.monthlyTrend;
    if (!trend?.length)
      return { curMtd: 0, prevMtd: 0, diff: 0, pct: 0, completionPct: 0 };

    const last = trend[trend.length - 1];
    const curMtd = last.cumContacted;
    const prevMtd = last.cumPrev;
    const diff = curMtd - prevMtd;
    const pct = prevMtd > 0 ? Math.round((diff / prevMtd) * 100) : 0;
    // tỷ lệ hoàn thành = lũy kế / (trung bình ngày tháng trước * tổng ngày tháng này)
    const daysInMonth = new Date(filter.year, filter.month, 0).getDate();
    const avgPerDay = prevMtd > 0 ? prevMtd / trend.length : 0;
    const projected = Math.round(avgPerDay * daysInMonth);
    const completionPct =
      projected > 0 ? Math.round((curMtd / projected) * 100) : 0;

    return { curMtd, prevMtd, diff, pct, completionPct };
  }, [displayMetrics, filter]);

  if (isLoading || !displayMetrics) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <span>Đang tải dữ liệu...</span>
      </div>
    );
  }

  const PIE_COLORS = ["#ffffff", "rgba(255,255,255,0.2)"];
  const REGION_COLORS = ["#c8102e", "#e53e3e", "#feb2b2", "#fca5a5"];
  const prev = displayMetrics.previousMonth ?? {};

  return (
    <div className={styles.dashboardContainer}>
      {/* ── HEADER ── */}
      <header className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.title}>CRM Analytics</h1>
          <p className={styles.subtitle}>
            Hiệu suất kinh doanh tháng {filter.month}/{filter.year}
          </p>
        </div>
        <div className={styles.filterGroup}>
          <div className={styles.selectWrapper}>
            <select
              className={styles.filterSelect}
              value={filter.month}
              onChange={(e) => setFilter({ ...filter, month: +e.target.value })}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.selectWrapper}>
            <select
              className={styles.filterSelect}
              value={filter.year}
              onChange={(e) => setFilter({ ...filter, year: +e.target.value })}
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* ── KPI ROW ── */}
      <div className={styles.kpiRow}>
        {/* Hero card */}
        <div className={styles.interactionCard}>
          <div className={styles.interactionMeta}>
            <label className={styles.cardLabel}>Tỷ lệ tương tác DN</label>
            <div className={styles.interactionValue}>
              {displayMetrics.totalInteractedEnterprises}
            </div>
            <div className={styles.interactionSub}>
              Trên tổng số <strong>{displayMetrics.totalEnterprises}</strong>{" "}
              doanh nghiệp
            </div>
            <DeltaBadge
              current={displayMetrics.totalInteractedEnterprises}
              previous={prev.totalInteractedEnterprises}
              invertColor
            />
          </div>
          <div className={styles.pieWrap}>
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie
                  data={interactionPieData}
                  innerRadius={36}
                  outerRadius={50}
                  dataKey="value"
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {interactionPieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <span className={styles.pct}>{interactionPct}%</span>
          </div>
        </div>

        {/* DN mới 30 ngày */}
        <div className={styles.miniCard}>
          <Users className={styles.miniIcon} size={16} />
          <label>DN mới 30 ngày</label>
          <div className={styles.miniVal}>
            {displayMetrics.newEnterprisesLast30Days ?? 0}
          </div>
          <DeltaBadge
            current={displayMetrics.newEnterprisesLast30Days ?? 0}
            previous={prev.newEnterprisesLast30Days}
          />
        </div>

        {/* Tiếp xúc trong tháng */}
        <div className={styles.miniCard}>
          <TrendingUp className={styles.miniIcon} size={16} />
          <label>Tiếp xúc trong tháng</label>
          <div className={styles.miniVal}>
            {displayMetrics.contactedEnterprisesThisMonth ?? 0}
          </div>
          <DeltaBadge
            current={displayMetrics.contactedEnterprisesThisMonth ?? 0}
            previous={prev.contactedEnterprisesThisMonth}
          />
        </div>

        {/* Lịch hẹn tuần này */}
        <div className={styles.miniCard}>
          <Calendar className={styles.miniIcon} size={16} />
          <label>Lịch hẹn tuần này</label>
          <div className={styles.miniVal}>
            {displayMetrics.appointmentsThisWeek ?? 0}
          </div>
          <DeltaBadge
            current={displayMetrics.appointmentsThisWeek ?? 0}
            previous={prev.appointmentsThisWeek}
          />
        </div>

        {/* Tỷ lệ chuyển đổi */}
        <div className={`${styles.miniCard} ${styles.miniCardAccent}`}>
          <Briefcase className={styles.miniIcon} size={16} />
          <label>Tỷ lệ chuyển đổi</label>
          <div className={`${styles.miniVal} ${styles.accentVal}`}>
            {displayMetrics.conversionRate}%
          </div>
          <DeltaBadge
            current={displayMetrics.conversionRate}
            previous={prev.conversionRate}
          />
        </div>
      </div>

      {/* ── MONTHLY TREND (LŨY KẾ) ── */}
      {displayMetrics.monthlyTrend?.length > 0 && (
        <div className={styles.trendBox}>
          {/* Header */}
          <div className={styles.trendHeader}>
            <h3 className={styles.sectionTitle}>
              <TrendingUp size={16} strokeWidth={2} />
              Lũy kế tiếp xúc DN trong tháng
            </h3>
            <div className={styles.trendLegend}>
              <span
                className={styles.legendLine}
                style={{ background: "#c8102e" }}
              />
              <span>Tháng {filter.month}</span>
              <span
                className={styles.legendLine}
                style={{
                  background:
                    "repeating-linear-gradient(to right,#94a3b8 0,#94a3b8 5px,transparent 5px,transparent 8px)",
                }}
              />
              <span>Tháng trước</span>
            </div>
          </div>

          {/* KPI mini summary */}
          <div className={styles.trendStats}>
            <div className={styles.trendStat}>
              <span className={styles.trendStatLabel}>
                Tháng {filter.month} (MTD)
              </span>
              <span className={styles.trendStatVal}>{trendStats.curMtd}</span>
              {trendStats.prevMtd > 0 && (
                <span
                  className={`${styles.trendDelta} ${
                    trendStats.diff >= 0
                      ? styles.trendDeltaUp
                      : styles.trendDeltaDown
                  }`}
                >
                  {trendStats.diff >= 0 ? "▲" : "▼"}&nbsp;
                  {trendStats.diff >= 0 ? "+" : ""}
                  {trendStats.diff}&nbsp; ({trendStats.diff >= 0 ? "+" : ""}
                  {trendStats.pct}% vs tháng trước)
                </span>
              )}
            </div>
            <div className={styles.trendStat}>
              <span className={styles.trendStatLabel}>
                Tháng trước (cùng kỳ)
              </span>
              <span className={styles.trendStatVal}>{trendStats.prevMtd}</span>
            </div>
            <div className={styles.trendStat}>
              <span className={styles.trendStatLabel}>
                Tỷ lệ hoàn thành dự kiến
              </span>
              <span
                className={`${styles.trendStatVal} ${
                  trendStats.completionPct >= 100 ? styles.trendStatGreen : ""
                }`}
              >
                {trendStats.completionPct}%
              </span>
            </div>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={180}>
            <LineChart
              data={displayMetrics.monthlyTrend}
              margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c8102e" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#c8102e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(d) => String(d)}
                interval={Math.floor(displayMetrics.monthlyTrend.length / 8)}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<TrendTooltip month={filter.month} />}
                cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
              />
              {/* Tháng hiện tại */}
              <Line
                type="monotone"
                dataKey="cumContacted"
                name={`Tháng ${filter.month}`}
                stroke="#c8102e"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: "#c8102e", strokeWidth: 0 }}
              />
              {/* Tháng trước */}
              <Line
                type="monotone"
                dataKey="cumPrev"
                name="Tháng trước"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
                activeDot={{ r: 3, fill: "#94a3b8", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── BOTTOM GRID ── */}
      <div className={styles.bottomGrid}>
        {/* Hiệu suất nhân viên */}
        <div className={styles.chartBox}>
          <h3 className={styles.sectionTitle}>Hiệu suất tiếp xúc nhân viên</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={displayMetrics.employeeStats}
              margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
              barSize={36}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="employeeName"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<BarTooltip />}
                cursor={{ fill: "rgba(200,16,46,0.06)" }}
              />
              <Bar
                dataKey="interactionCount"
                fill="#c8102e"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Phân bổ khu vực */}
        <div className={styles.chartBox}>
          <h3 className={styles.sectionTitle}>Phân bổ theo khu vực</h3>
          <div className={styles.regionSummary}>
            {displayMetrics.regionDistribution?.map((r, i) => {
              const pct = r.totalEnterprises
                ? Math.round((r.contacted / r.totalEnterprises) * 100)
                : 0;
              return (
                <div key={r.region} className={styles.regionRow}>
                  <span
                    className={styles.regionDot}
                    style={{
                      background: REGION_COLORS[i % REGION_COLORS.length],
                    }}
                  />
                  <span className={styles.regionName}>{r.region}</span>
                  <span className={styles.regionContacted}>
                    Tiếp xúc <strong>{r.contacted}</strong>/{r.totalEnterprises}{" "}
                    DN trong tháng
                  </span>
                  <span className={styles.regionPct}>{pct}%</span>
                </div>
              );
            })}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={displayMetrics.regionDistribution}
                dataKey="totalEnterprises"
                nameKey="region"
                cx="50%"
                cy="50%"
                outerRadius={75}
                innerRadius={30}
                paddingAngle={2}
                label={({ region, percent }) =>
                  percent > 0.03
                    ? `${region} ${(percent * 100).toFixed(0)}%`
                    : ""
                }
                labelLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
              >
                {displayMetrics.regionDistribution?.map((_, i) => (
                  <Cell
                    key={i}
                    fill={REGION_COLORS[i % REGION_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<RegionTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Lịch hẹn trong tuần */}
        <div className={styles.listBox}>
          <h3 className={styles.sectionTitle}>
            <Calendar size={16} strokeWidth={2} />
            Lịch hẹn trong tuần
          </h3>
          <div className={styles.scrollList}>
            {weeklyAppointments.length ? (
              weeklyAppointments.map((app, idx) => (
                <div key={idx} className={styles.appItem}>
                  <div className={styles.appDateBadge}>
                    <span className={styles.appTime}>
                      {formatTime(app.scheduledTime)}
                    </span>
                    <span className={styles.appDate}>
                      {formatDate(app._date)}
                    </span>
                    <span className={styles.appDow}>{app._dayLabel}</span>
                  </div>
                  <div className={styles.appInfo}>
                    <strong>{app.enterpriseName}</strong>
                    <p>
                      {getTypeLabel(app.appointmentType) || app.consultantName}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptyNote}>
                Không có lịch hẹn nào trong tuần này.
              </p>
            )}
          </div>
        </div>

        {/* Cảnh báo DN chưa tiếp xúc */}
        <div className={`${styles.listBox} ${styles.warningBox}`}>
          <h3 className={styles.sectionTitle}>
            <AlertCircle
              size={16}
              strokeWidth={2}
              className={styles.warnIcon}
            />
            Cảnh báo DN 2000/20K chưa tiếp xúc
          </h3>
          <div className={styles.warnSummary}>
            Các doanh nghiệp thuộc danh sách ưu tiên <strong>VNR2000</strong> và{" "}
            <strong>VNR20K</strong> chưa có{" "}
            <strong>bất kỳ lần tiếp xúc nào</strong> được ghi nhận trong hệ
            thống. Cần ưu tiên liên hệ sớm để không bỏ lỡ cơ hội.
          </div>
          <div className={styles.scrollList}>
            {displayMetrics.uncontactedEnterprises?.length ? (
              displayMetrics.uncontactedEnterprises.map((ent) => (
                <div key={ent.enterpriseId} className={styles.warningItem}>
                  <div className={styles.warnBadge}>{ent.type}</div>
                  <div className={styles.entMain}>
                    <strong>{ent.enterpriseName}</strong>
                    <span>
                      <MapPin
                        size={10}
                        style={{ display: "inline", marginRight: 3 }}
                      />
                      {ent.region} · {ent.consultantName}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptyNote}>
                Không có doanh nghiệp nào cần cảnh báo.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
