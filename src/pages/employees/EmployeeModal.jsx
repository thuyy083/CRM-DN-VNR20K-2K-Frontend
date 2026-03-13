import { useState } from "react";
import { toast } from "react-toastify";
import { createUser, updateUser } from "../../services/userService";
import "./EmployeeModal.scss";

function EmployeeModal({ user, close, reload }) {
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.substring(0, 10) : "",
    status: user?.status || "ACTIVE",
    role: user?.role || "CONSULTANT",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm({
      ...form,
      [field]: value,
    });
    // Xóa lỗi của trường đó khi người dùng bắt đầu nhập lại
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: "",
      });
    }
  };

  // Hàm kiểm tra định dạng email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // 1. FRONTEND VALIDATION
    const newErrors = {};
    let hasError = false;

    if (!form.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ tên";
      hasError = true;
    }

    if (!user) {
      if (!form.email.trim()) {
        newErrors.email = "Vui lòng nhập email";
        hasError = true;
      } else if (!isValidEmail(form.email)) {
        newErrors.email = "Email không đúng định dạng";
        hasError = true;
      }

      if (!form.password || form.password.length < 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    // 2. XỬ LÝ GỌI BACKEND
    try {
      setErrors({});

      // Giữ nguyên định dạng YYYY-MM-DD để gửi lên Java Backend
      const dataToSubmit = {
        ...form,
        dateOfBirth: form.dateOfBirth || null,
      };

      if (user) {
        await updateUser(user.id, dataToSubmit);
        toast.success("Cập nhật nhân viên thành công");
      } else {
        await createUser(dataToSubmit);
        toast.success("Thêm nhân viên thành công");
      }

      // QUAN TRỌNG: Đợi tải lại dữ liệu từ server xong rồi mới đóng modal
      await reload();
      close();
    } catch (error) {
      console.error("Submit error:", error.response?.data);
      const responseData = error.response?.data;

      if (
        responseData &&
        responseData.errors &&
        !Array.isArray(responseData.errors)
      ) {
        setErrors(responseData.errors);
      } else if (responseData && Array.isArray(responseData.errors)) {
        const backendErrors = {};
        responseData.errors.forEach((err) => {
          backendErrors[err.field] = err.message;
        });
        setErrors(backendErrors);
      } else {
        toast.error(responseData?.message || "Có lỗi xảy ra khi lưu nhân viên");
      }
    }
  };

  return (
    <div className="modal">
      <div className="modal-box">
        <h3>{user ? "Cập nhật nhân viên" : "Thêm nhân viên"}</h3>

        <div className="form-content">
          <div className="form-group">
            <label>
              Họ và tên <span className="required">*</span>
            </label>
            <input
              className={errors.fullName ? "input-error" : ""}
              placeholder="Nhập họ tên"
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
            />
            {errors.fullName && (
              <span className="error-text">{errors.fullName}</span>
            )}
          </div>

          <div className="form-group">
            <label>
              Email <span className="required">*</span>
            </label>
            <input
              className={errors.email ? "input-error" : ""}
              placeholder="Nhập email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={!!user}
              style={
                user
                  ? {
                      backgroundColor: "#f3f4f6",
                      cursor: "not-allowed",
                      color: "#6b7280",
                    }
                  : {}
              }
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          {!user && (
            <div className="form-group">
              <label>
                Mật khẩu <span className="required">*</span>
              </label>
              <input
                className={errors.password ? "input-error" : ""}
                type="password"
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
              />
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                className={errors.phone ? "input-error" : ""}
                placeholder="Nhập số điện thoại"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
              {errors.phone && (
                <span className="error-text">{errors.phone}</span>
              )}
            </div>

            <div className="form-group">
              <label>Ngày sinh</label>
              <input
                type="date"
                className={errors.dateOfBirth ? "input-error" : ""}
                value={form.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              />
              {errors.dateOfBirth && (
                <span className="error-text">{errors.dateOfBirth}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Vai trò</label>
              <select
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
              >
                <option value="ADMIN">Quản trị viên</option>
                <option value="CONSULTANT">Nhân viên tư vấn</option>
              </select>
            </div>

            <div className="form-group">
              <label>Trạng thái</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Ngưng hoạt động</option>
              </select>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={close}>
            Hủy
          </button>
          <button className="save-btn" onClick={handleSubmit}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmployeeModal;
