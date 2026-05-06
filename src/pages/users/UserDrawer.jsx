import { useEffect, useMemo, useState } from "react";
import { getEnterpriseById, getIndustries } from "../../services/enterpriseService";
import "./UserDrawer.scss";
import { toast } from "react-toastify";
import { getInteractionImageUrl, updateInteractionDescription } from "../../services/interactionService";

const POTENTIAL_STORAGE_KEY = "enterprise_potential_map";

const RESULT_MAP = {
  PENDING: "Chờ xử lý",
  NEED_FOLLOW_UP: "Cần chăm sóc",
  NEXT_APPOINTMENT: "Hẹn lần sau",
  INTERESTED: "Tiềm năng",
  IN_PROGRESS: "Đang thương thảo",
  CLOSED_WON: "Ký hợp đồng",
  CLOSED_LOST: "Thất bại"
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
  onEdit,
  onViewImages,
  onViewContract
}) {

  if (!rows.length) {
    return <div className="section-empty">{emptyText}</div>;
  }

  return (
    <table className="history-table large-centered-table">
      <thead>
        <tr>
          <th>STT</th>
          <th>Ngày</th>
          <th>Loại</th>
          <th>Kết quả</th>
          <th>Người liên hệ</th>
          <th>Người phụ trách</th>
          <th>Địa điểm</th>
          <th>Nội dung</th>
          <th>Ảnh</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((item, index) => (
          <tr key={item.id}>
            <td>{index + 1}</td>
            <td>{formatDateOnly(item.interactionTime)}</td>

            <td>{item.interactionType || "-"}</td>
            {item.result === "CLOSED_WON" && item.usages?.length > 0 ? (
              <button
                className="result-badge clickable"
                onClick={() => onViewContract(item)}
              >
                ✅ {RESULT_MAP[item.result]}
              </button>
            ) : (
              <span className={`result-badge ${item.result}`}>
                {RESULT_MAP[item.result] || item.result}
              </span>
            )}

            <td>{item.contactName || "-"}</td>
            <td>{item.consultantName || "-"}</td>
            <td>{item.location || "-"}</td>

            <td className="action-cell">
              <button className="btn-action btn-view" onClick={() => onEdit(item)}>
                Nội dung
              </button>
            </td>

            <td className="action-cell">
              <button className="btn-action btn-image" onClick={() => onViewImages(item)}>
                Ảnh
              </button>
            </td>

            {/* <td className="action-cell">
  {item.result === "CLOSED_WON" && item.usages?.length > 0 ? (
    <button
      className="btn-action btn-contract"
      onClick={() => onViewContract(item)}
    >
      Hợp đồng
    </button>
  ) : (
    <span className="no-data">-</span>
  )}
</td> */}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UserDrawer({ open, interaction, onClose, onReload }) {
  const [localInteractions, setLocalInteractions] = useState([]);
  const [enterpriseInfo, setEnterpriseInfo] = useState(null);
  const [industries, setIndustries] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editingDescription, setEditingDescription] = useState("");
  const [previewImages, setPreviewImages] = useState([]);
  const [selectedContract, setSelectedContract] = useState([]);
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

  const enterpriseId = interaction?.enterpriseId;

  const potentialFromStorage = useMemo(() => {
    try {
      const raw = localStorage.getItem(POTENTIAL_STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      return Boolean(map[String(enterpriseId)]);
    } catch (error) {
      console.error("Cannot parse potential storage", error);
      return false;
    }
  }, [enterpriseId]);

  const isPotential =
    isPotentialEnterprise(enterpriseInfo) ||
    Boolean(interaction?.isPotential) ||
    potentialFromStorage;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setLocalInteractions(interaction?.allInteractions || []);
    setEnterpriseInfo(null);
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
                onEdit={(item) => {
                  setEditingItem(item);
                  setEditingDescription(item.description || "");
                }}
                onViewImages={(item) => {
                  const images = (item.photoPaths || []).map(getInteractionImageUrl);
                  setPreviewImages(images);
                }}
                onViewContract={(item) => {
                  setSelectedContract(item.usages || []);
                }}
              />
            </section>

            {editingItem && (
              <div className="content-preview-overlay" onClick={() => setEditingItem(null)}>
                <div className="content-preview-dialog" onClick={(e) => e.stopPropagation()}>

                  <div className="content-preview-header">
                    <h5>Sửa nội dung tiếp xúc</h5>
                    <button
                      className="content-close-btn"
                      onClick={() => setEditingItem(null)}
                    >
                      ×
                    </button>
                  </div>

                  <textarea
                    className="edit-textarea"
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    placeholder="Nhập nội dung..."
                    autoFocus
                  />

                  <div className="content-preview-actions">
                    <button onClick={() => setEditingItem(null)}>Hủy</button>

                    <button
                      disabled={!editingDescription.trim()}
                      onClick={async () => {
                        try {
                          const value = editingDescription.trim();

                          await updateInteractionDescription(editingItem.id, value);

                          setLocalInteractions((prev) =>
                            prev.map((it) =>
                              it.id === editingItem.id
                                ? { ...it, description: value }
                                : it
                            )
                          );

                          toast.success("Cập nhật thành công");
                          setEditingItem(null);

                          if (onReload) await onReload();
                        } catch (err) {
                          console.error(err);
                          toast.error("Lỗi cập nhật");
                        }
                      }}
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              </div>
            )}
            {previewImages.length > 0 && (
              <div
                className="content-preview-overlay"
                onClick={() => setPreviewImages([])}
              >
                <div
                  className="content-preview-dialog"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="content-preview-header">
                    <h5>Hình ảnh tiếp xúc</h5>
                    <button
                      className="content-close-btn"
                      onClick={() => setPreviewImages([])}
                    >
                      ×
                    </button>
                  </div>

                  <div className="image-preview-grid">
                    {previewImages.map((img, index) => {
                      // Thêm điều kiện kiểm tra: img.startsWith('/uploads/')
                      const imageSrc = (img.startsWith('http') || img.startsWith('data:') || img.startsWith('/uploads/'))
                        ? img
                        : `/uploads/${img}`;

                      return (
                        <img
                          key={index}
                          src={imageSrc}
                          alt="interaction preview"
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {selectedContract.length > 0 && (
              <div
                className="content-preview-overlay"
                onClick={() => setSelectedContract([])}
              >
                <div
                  className="content-preview-dialog"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="content-preview-header">
                    <h5>Thông tin hợp đồng</h5>
                    <button
                      className="content-close-btn"
                      onClick={() => setSelectedContract([])}
                    >
                      ×
                    </button>
                  </div>

                  <div className="contract-list">
                    {selectedContract.map((c) => (
                      <div key={c.id} className="contract-card">
                        <div className="contract-header">
                          <span className="contract-service">{c.serviceName}</span>
                          <span className="contract-status">{c.status}</span>
                        </div>

                        <div className="contract-body">
                          <div>
                            <b>Mã dịch vụ:</b>
                            <span>{c.serviceCode}</span>
                          </div>

                          <div>
                            <b>Số hợp đồng:</b>
                            <span>{c.contractNumber}</span>
                          </div>

                          <div>
                            <b>Ngày bắt đầu:</b>
                            <span>
                              {Array.isArray(c.startDate)
                                ? `${c.startDate[2]}/${c.startDate[1]}/${c.startDate[0]}`
                                : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
