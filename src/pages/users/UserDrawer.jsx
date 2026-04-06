import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { updateInteraction } from "../../services/interactionService";
import { getEnterpriseById, getIndustries } from "../../services/enterpriseService";
import "./UserDrawer.scss";

const POTENTIAL_STORAGE_KEY = "enterprise_potential_map";

const resultOptions = [
  { value: "PENDING", label: "Đang xử lý" },
  { value: "FAILED", label: "Hủy" },
  { value: "SUCCESSFUL", label: "Thành công" },
];

const sanitizeInteractionContent = (value) => {
  if (!value) return "-";
  const cleaned = String(value).replace(/\s*Chức\s*vụ[^:]*:\s*.*$/iu, "").trim();
  return cleaned || "-";
};

const formatDateOnly = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
};

const getTimeValue = (value) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const sortByDateDesc = (list) => {
  return [...list].sort((a, b) => {
    const first = getTimeValue(a.interactionTime) || 0;
    const second = getTimeValue(b.interactionTime) || 0;
    return second - first;
  });
};

const isPotentialEnterprise = (item) => {
  const raw =
    item?.isPotential ??
    item?.potential ??
    item?.is_potential ??
    item?.potentialFlag ??
    item?.isPotentialCustomer ??
    item?.potentialCustomer;

  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw === 1;
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    return ["true", "1", "yes", "y", "potential", "tiem_nang"].includes(normalized);
  }
  return false;
};

function InteractionTable({
  rows,
  emptyText,
  updatingStatusId,
  onOpenStatusPopup,
  onViewContent,
}) {

  if (!rows.length) {
    return <div className="section-empty">{emptyText}</div>;
  }

  return (
    <table className="history-table large-centered-table">
      <thead>
        <tr>
          <th>STT</th>
          <th>Ngày tiếp xúc</th>
          <th>Người liên hệ</th>
          <th>Nội dung</th>
          <th>Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((item, index) => (
          <tr key={`${item.id}-${item.interactionTime || "no-time"}`}>
            <td>{index + 1}</td>
            <td>{formatDateOnly(item.interactionTime)}</td>
            <td>{item.contactName || "-"}</td>
            <td>
              <button className="view-content-btn" type="button" onClick={() => onViewContent(item)}>
                Xem nội dung
              </button>
            </td>
            <td>
              <button
                className="view-status-btn"
                type="button"
                disabled={updatingStatusId === item.id}
                onClick={() => onOpenStatusPopup(item)}
              >
                {updatingStatusId === item.id
                  ? "Đang cập nhật"
                  : resultOptions.find((opt) => opt.value === (item.result || "PENDING"))?.label || "Trạng thái"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UserDrawer({ open, interaction, onClose, onReload }) {
  const [localInteractions, setLocalInteractions] = useState([]);
  const [enterpriseInfo, setEnterpriseInfo] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [previewContent, setPreviewContent] = useState("");
  const [statusPopup, setStatusPopup] = useState({ open: false, item: null, value: "PENDING" });
  const [industries, setIndustries] = useState([]);
  useEffect(() => {
  const fetchIndustries = async () => {
    try {
      const res = await getIndustries();
      setIndustries(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  if (open) {
    fetchIndustries();
  }
}, [open]);
const getIndustryName = (code) => {
  if (!code) return "-";
  if (!industries.length) return code;

  const found = industries.find((i) => i.code === code);
  return found?.name || code;
};
  const detailRows = useMemo(() => sortByDateDesc(localInteractions), [localInteractions]);

  const potentialFromStorage = useMemo(() => {
    try {
      const raw = localStorage.getItem(POTENTIAL_STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      return Boolean(map[String(interaction?.enterpriseId)]);
    } catch (error) {
      console.error("Cannot parse potential storage", error);
      return false;
    }
  }, [interaction?.enterpriseId]);

  const isPotential =
    isPotentialEnterprise(enterpriseInfo) ||
    Boolean(interaction?.isPotential) ||
    potentialFromStorage;

  useEffect(() => {
    setLocalInteractions(interaction?.allInteractions || []);
    setEnterpriseInfo(null);
    setUpdatingStatusId(null);
    setPreviewContent("");
    setStatusPopup({ open: false, item: null, value: "PENDING" });
  }, [interaction]);

  useEffect(() => {
    const fetchEnterpriseInfo = async () => {
      if (!open || !interaction?.enterpriseId) return;

      try {
        const res = await getEnterpriseById(interaction.enterpriseId);
        setEnterpriseInfo(res?.data?.data || res?.data || null);
      } catch (error) {
        console.error(error);
      }
    };

    fetchEnterpriseInfo();
  }, [open, interaction]);

  const handleOpenStatusPopup = (item) => {
    setStatusPopup({
      open: true,
      item,
      value: item.result || "PENDING",
    });
  };

  const handleStatusPopupChange = async (nextStatus) => {
    const item = statusPopup.item;
    if (!item) return;

    if (nextStatus === item.result) {
      setStatusPopup({ open: false, item: null, value: "PENDING" });
      return;
    }

    const payload = {
      interactionType: item.interactionType,
      result: nextStatus,
      interactionTime: item.interactionTime,
      location: item.location || null,
      description: item.description || null,
    };

    try {
      setUpdatingStatusId(item.id);
      await updateInteraction(item.id, payload);

      setLocalInteractions((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, result: nextStatus } : it))
      );
      setStatusPopup({ open: false, item: null, value: "PENDING" });

      toast.success("Cập nhật trạng thái thành công");
      if (onReload) {
        await onReload();
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể cập nhật trạng thái");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <div className={`drawer-overlay ${open ? "open" : ""}`} onClick={onClose}>
      <aside className={`drawer-panel ${open ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3 className="drawer-enterprise-title">
            <span>{interaction?.enterpriseName || "Chi tiết tiếp xúc"}</span>
            {isPotential && <span className="potential-star">★</span>}
          </h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {!interaction ? (
          <div className="drawer-empty">Chưa có dữ liệu để hiển thị</div>
        ) : (
          <div className="drawer-body">
            <section className="enterprise-info-section">
              <h4>Thông tin doanh nghiệp</h4>
              <div className="enterprise-info-grid">
                <div>
                  <b>Tên</b>
                  <span className="enterprise-name-cell">
                    <span>{enterpriseInfo?.name || interaction?.enterpriseName || "-"}</span>
                    {isPotential && <span className="potential-star">★</span>}
                  </span>
                </div>
                <div>
                  <b>MST:</b>
                  <span>{enterpriseInfo?.taxCode || "-"}</span>
                </div>
                <div>
                  <b>Ngành:</b>
<span>{getIndustryName(enterpriseInfo?.industry)}</span>
                </div>
                <div>
                  <b>Nhân viên:</b>
                  <span>{enterpriseInfo?.employeeCount ?? "-"}</span>
                </div>
                <div>
                  <b>Phone:</b>
                  <span>{enterpriseInfo?.phone || "-"}</span>
                </div>
                <div>
                  <b>Website:</b>
                  <span>{enterpriseInfo?.website || "-"}</span>
                </div>
              </div>
            </section>

            <section className="history-section centered-detail-table">
              <h4>Bảng Chi Tiết Tiếp Xúc</h4>
              <InteractionTable
                rows={detailRows}
                emptyText="Chưa có tiếp xúc nào"
                updatingStatusId={updatingStatusId}
                onOpenStatusPopup={handleOpenStatusPopup}
                onViewContent={(item) => setPreviewContent(sanitizeInteractionContent(item.description))}
              />
            </section>

            {previewContent && (
              <div className="content-preview-overlay" onClick={() => setPreviewContent("")}>
                <div className="content-preview-dialog" onClick={(e) => e.stopPropagation()}>
                  <div className="content-preview-header">
                    <h5>Nội dung tiếp xúc</h5>
                    <button
                      type="button"
                      className="content-close-btn"
                      onClick={() => setPreviewContent("")}
                      aria-label="Đóng"
                    >
                      ×
                    </button>
                  </div>
                  <p>{previewContent}</p>
                  <div className="content-preview-actions">
                    <button type="button" onClick={() => setPreviewContent("")}>Đóng</button>
                  </div>
                </div>
              </div>
            )}

            {statusPopup.open && statusPopup.item && (
              <div className="content-preview-overlay" onClick={() => setStatusPopup({ open: false, item: null, value: "PENDING" })}>
                <div className="content-preview-dialog" onClick={(e) => e.stopPropagation()}>
                  <div className="content-preview-header">
                    <h5>Cập nhật trạng thái</h5>
                    <button
                      type="button"
                      className="content-close-btn"
                      onClick={() => setStatusPopup({ open: false, item: null, value: "PENDING" })}
                      aria-label="Đóng"
                    >
                      ×
                    </button>
                  </div>
                  <select
                    value={statusPopup.value}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setStatusPopup((prev) => ({ ...prev, value: nextValue }));
                      handleStatusPopupChange(nextValue);
                    }}
                  >
                    {resultOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

export default UserDrawer;
