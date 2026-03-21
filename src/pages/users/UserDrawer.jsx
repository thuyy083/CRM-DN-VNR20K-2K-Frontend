import "./UserDrawer.scss";

const typeMap = {
  PHONE_CALL: "Gọi điện",
  OFFLINE_MEETING: "Gặp mặt",
  EMAIL_QUOTE: "Email",
  DEMO: "Thăm quan",
  ONLINE_MEETING: "Họp online",
  CONTRACT_SIGNING: "Ký hợp đồng",
  CUSTOMER_SUPPORT: "Hỗ trợ",
  OTHER: "Khác",
};

const resultMap = {
  PENDING: "Đang xử lý",
  NEED_FOLLOW_UP: "Cần theo dõi",
  SUCCESSFUL: "Thành công",
  FAILED: "Thất bại",
};

const formatDate = (value) => {
  // Dùng cho mốc thời gian có cả ngày + giờ.
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
};

const formatDateOnly = (value) => {
  // Dùng cho trường ngày tiếp xúc, chỉ cần phần ngày.
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
};

function UserDrawer({ open, interaction, onClose }) {
  return (
    <div className={`drawer-overlay ${open ? "open" : ""}`} onClick={onClose}>
      <aside className={`drawer-panel ${open ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>Chi tiết tiếp xúc</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {!interaction ? (
          <div className="drawer-empty">Chưa có dữ liệu để hiển thị</div>
        ) : (
          // Khu vực hiển thị toàn bộ thông tin chi tiết của một bản ghi tiếp xúc.
          <div className="drawer-body">
            <div className="field"><span>ID:</span><strong>{interaction.id || "-"}</strong></div>
            <div className="field"><span>Nhân viên:</span><strong>{interaction.consultantName || "-"}</strong></div>
            <div className="field"><span>Doanh nghiệp:</span><strong>{interaction.enterpriseName || "-"}</strong></div>
            <div className="field"><span>Người liên hệ:</span><strong>{interaction.contactName || "-"}</strong></div>
            <div className="field"><span>Loại:</span><strong>{typeMap[interaction.interactionType] || interaction.interactionType || "-"}</strong></div>
            <div className="field"><span>Trạng thái:</span><strong>{resultMap[interaction.result] || interaction.result || "-"}</strong></div>
            <div className="field"><span>Ngày tiếp xúc:</span><strong>{formatDateOnly(interaction.interactionTime)}</strong></div>
            <div className="field"><span>Địa điểm:</span><strong>{interaction.location || "-"}</strong></div>
            <div className="field multiline"><span>Nội dung:</span><p>{interaction.description || "-"}</p></div>
            <div className="field"><span>Tạo lúc:</span><strong>{formatDate(interaction.createdAt)}</strong></div>
            <div className="field"><span>Cập nhật:</span><strong>{formatDate(interaction.updatedAt)}</strong></div>
          </div>
        )}
      </aside>
    </div>
  );
}

export default UserDrawer;
