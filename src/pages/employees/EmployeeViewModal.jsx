import "./EmployeeViewModal.scss"; // Tạo một file SCSS mới riêng cho nó

function EmployeeViewModal({ user, close }) {
  if (!user) return null;

  const roleMap = {
    ADMIN: "Quản trị viên",
    CONSULTANT: "Nhân viên tư vấn",
    STAFF: "Nhân viên",
  };

  const getGenderLabel = (gender) => {
    if (!gender) return "-";
    const genderUpper = gender.toUpperCase();
    if (genderUpper === "MALE") return "Nam";
    if (genderUpper === "FEMALE") return "Nữ";
    if (genderUpper === "OTHER") return "Khác";
    return gender;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="view-modal-overlay">
      <div className="view-modal-box">
        <div className="modal-header">
          <h3>Hồ sơ nhân viên</h3>
          <button className="close-icon-btn" onClick={close}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="view-content">
          {/* KHỐI 1: THÔNG TIN CƠ BẢN */}
          <div className="info-card">
            <h4 className="card-title">Thông tin cơ bản</h4>

            <div className="info-row">
              <span className="info-label">ID Nhân viên:</span>
              <span className="info-value highlight">#{user.id}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Họ và tên:</span>
              <span className="info-value">{user.fullName || user.name}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Email liên hệ:</span>
              <span className="info-value">{user.email}</span>
            </div>

            <div className="info-row no-border">
              <span className="info-label">Số điện thoại:</span>
              <span className="info-value">
                {user.phone || "Chưa cập nhật"}
              </span>
            </div>
          </div>

          {/* KHỐI 2: CHIA CỘT */}
          <div className="info-grid">
            {/* Cột Trái: Cá nhân */}
            <div className="info-card half">
              <h4 className="card-title">Cá nhân</h4>
              <div className="info-block">
                <span className="info-label">Giới tính:</span>
                <span className="info-value">
                  {getGenderLabel(user.gender)}
                </span>
              </div>
              <div className="info-block">
                <span className="info-label">Ngày sinh:</span>
                <span className="info-value">
                  {formatDate(user.dateOfBirth)}
                </span>
              </div>
            </div>

            {/* Cột Phải: Công việc */}
            <div className="info-card half">
              <h4 className="card-title">Công việc</h4>
              <div className="info-block">
                <span className="info-label">Vai trò:</span>
                <span className="info-value">
                  {roleMap[user.role] || user.role}
                </span>
              </div>
              <div className="info-block">
                <span className="info-label">Trạng thái:</span>
                <span
                  className={`status-text ${user.status === "ACTIVE" ? "active" : "inactive"}`}
                >
                  {user.status === "ACTIVE"
                    ? "Đang hoạt động"
                    : "Ngưng hoạt động"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-close-full" onClick={close}>
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmployeeViewModal;
