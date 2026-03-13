import { useState } from "react";
import { toast } from "react-toastify";
import {
  createUser,
  updateUser,
  updateMyPassword,
  resetUserPasswordByAdmin,
} from "../../services/userService";
import "./EmployeeModal.scss";

function EmployeeModal({ user, close, reload, currentUserRole = "ADMIN" }) {
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.substring(0, 10) : "",
    status: user?.status || "ACTIVE",
    role: user?.role || "CONSULTANT",
    password: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm({
      ...form,
      [field]: value,
    });
    // Xóa lỗi khi người dùng bắt đầu gõ lại
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: "",
      });
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    const newErrors = {};
    let hasError = false;

    // 1. Validate chung
    if (!form.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ tên";
      hasError = true;
    }

    // 2. Validate TẠO MỚI
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

    // 3. Validate CẬP NHẬT (KHI TICK VÀO ĐỔI MẬT KHẨU)
    if (user && isChangingPassword) {
      // Chỉ bắt buộc nhập mật khẩu cũ nếu KHÔNG phải ADMIN
      if (currentUserRole !== "ADMIN" && !form.oldPassword) {
        newErrors.oldPassword = "Vui lòng nhập mật khẩu cũ";
        hasError = true;
      }

      if (!form.newPassword || form.newPassword.length < 6) {
        newErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
        hasError = true;
      }

      if (form.newPassword !== form.confirmPassword) {
        newErrors.confirmPassword = "Xác nhận mật khẩu không khớp";
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    // 4. GỌI API BACKEND
    try {
      setErrors({});

      // Gom nhóm thông tin cơ bản (Không chứa password)
      const profileData = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth || null,
        role: form.role,
        status: form.status,
      };

      if (user) {
        // Cập nhật thông tin cơ bản trước
        await updateUser(user.id, profileData);

        // Xử lý đổi mật khẩu (nếu có tick) dựa trên Role
        if (isChangingPassword) {
          if (currentUserRole === "ADMIN") {
            // ADMIN thao tác: Gọi API Reset Password (Chỉ cần pass mới)
            const adminPasswordPayload = {
              newPassword: form.newPassword,
            };
            await resetUserPasswordByAdmin(user.id, adminPasswordPayload);
          } else {
            // USER tự thao tác: Gọi API Update My Password (Cần pass cũ và pass mới)
            const userPasswordPayload = {
              oldPassword: form.oldPassword,
              newPassword: form.newPassword,
            };
            await updateMyPassword(userPasswordPayload);
          }
        }

        toast.success("Cập nhật nhân viên thành công");
      } else {
        // Tạo mới gửi kèm luôn password
        const newUserData = {
          ...profileData,
          password: form.password,
        };
        await createUser(newUserData);
        toast.success("Thêm nhân viên thành công");
      }

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

          {user && (
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="change-password-toggle"
                checked={isChangingPassword}
                onChange={(e) => setIsChangingPassword(e.target.checked)}
              />
              <label htmlFor="change-password-toggle">
                Thay đổi / Cấp lại mật khẩu
              </label>
            </div>
          )}

          {user && isChangingPassword && (
            <div className="password-section">
              {/* CHỈ HIỆN Ô MẬT KHẨU CŨ NẾU KHÔNG PHẢI ADMIN */}
              {currentUserRole !== "ADMIN" && (
                <div className="form-group">
                  <label>
                    Mật khẩu cũ <span className="required">*</span>
                  </label>
                  <input
                    className={errors.oldPassword ? "input-error" : ""}
                    type="password"
                    placeholder="Nhập mật khẩu hiện tại"
                    value={form.oldPassword}
                    onChange={(e) =>
                      handleChange("oldPassword", e.target.value)
                    }
                  />
                  {errors.oldPassword && (
                    <span className="error-text">{errors.oldPassword}</span>
                  )}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Mật khẩu mới <span className="required">*</span>
                  </label>
                  <input
                    className={errors.newPassword ? "input-error" : ""}
                    type="password"
                    placeholder="Mật khẩu mới"
                    value={form.newPassword}
                    onChange={(e) =>
                      handleChange("newPassword", e.target.value)
                    }
                  />
                  {errors.newPassword && (
                    <span className="error-text">{errors.newPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Xác nhận <span className="required">*</span>
                  </label>
                  <input
                    className={errors.confirmPassword ? "input-error" : ""}
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                  />
                  {errors.confirmPassword && (
                    <span className="error-text">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>
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
