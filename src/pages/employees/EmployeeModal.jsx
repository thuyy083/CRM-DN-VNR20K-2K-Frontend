import { useState, useEffect, useRef } from "react";
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
  const [openDropdown, setOpenDropdown] = useState(null); // Quản lý trạng thái dropdown
  const dropdownRef = useRef(null);

  // 1. Hàm chuyển từ API (DD-MM-YYYY) sang form (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return "";
    const dateOnly = date.substring(0, 10);
    // Nếu chuỗi đã có định dạng YYYY-MM-DD thì giữ nguyên
    if (dateOnly.indexOf("-") === 4) {
      return dateOnly;
    }
    // Chuyển DD-MM-YYYY thành YYYY-MM-DD
    const parts = dateOnly.split("-");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month}-${day}`;
    }
    return dateOnly;
  };

  const calculateAge = (dateString) => {
    if (!dateString) return null;

    const today = new Date();
    const birthDate = new Date(dateString);

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Nếu chưa tới sinh nhật năm nay thì trừ 1
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    gender: user?.gender || "MALE",
    dateOfBirth: user?.dateOfBirth ? formatDateForInput(user.dateOfBirth) : "",
    status: user?.status || "ACTIVE",
    role: user?.role || "CONSULTANT",
    password: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (field, value) => {
    setForm({
      ...form,
      [field]: value,
    });
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

  // 2. Hàm chuyển từ form (YYYY-MM-DD) ngược lại cho API (DD-MM-YYYY)
  const formatDateForSubmit = (date) => {
    if (!date) return null;
    const parts = date.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      const [year, month, day] = parts;
      return `${day}-${month}-${year}`;
    }
    return date;
  };

  const handleSubmit = async () => {
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
      if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = "Mật khẩu nhập lại không khớp";
        hasError = true;
      }
    }

    if (user && isChangingPassword) {
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

    // --- THÊM LOGIC KIỂM TRA TUỔI TẠI ĐÂY ---
    if (form.dateOfBirth) {
      const age = calculateAge(form.dateOfBirth);
      if (age !== null && age < 18) {
        newErrors.dateOfBirth = "Nhân viên phải đủ 18 tuổi trở lên";
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    try {
      setErrors({});
      const profileData = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        // Chuyển đổi ngày sinh trước khi gửi lên API
        dateOfBirth: formatDateForSubmit(form.dateOfBirth),
        role: form.role,
        status: form.status,
      };

      if (user) {
        await updateUser(user.id, profileData);

        if (isChangingPassword) {
          if (currentUserRole === "ADMIN") {
            await resetUserPasswordByAdmin(user.id, {
              newPassword: form.newPassword,
            });
          } else {
            await updateMyPassword({
              oldPassword: form.oldPassword,
              newPassword: form.newPassword,
            });
          }
        }
        toast.success("Cập nhật nhân viên thành công");
      } else {
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

  // Các mảng dữ liệu cho Dropdown
  const genderOptions = [
    { value: "MALE", label: "Nam" },
    { value: "FEMALE", label: "Nữ" },
    { value: "OTHER", label: "Khác" },
  ];

  const roleOptions = [
    { value: "ADMIN", label: "Quản trị viên" },
    { value: "CONSULTANT", label: "Nhân viên tư vấn" },
  ];

  const statusOptions = [
    { value: "ACTIVE", label: "Đang hoạt động" },
    { value: "INACTIVE", label: "Ngưng hoạt động" },
  ];

  return (
    <div className="modal">
      <div className="modal-box" ref={dropdownRef}>
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
            <>
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
              <div className="form-group">
                <label>
                  Nhập lại mật khẩu <span className="required">*</span>
                </label>
                <input
                  className={errors.confirmPassword ? "input-error" : ""}
                  type="password"
                  placeholder="Xác nhận lại mật khẩu"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                />
                {errors.confirmPassword && (
                  <span className="error-text">{errors.confirmPassword}</span>
                )}
              </div>
            </>
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
            {/* DROPDOWN GIỚI TÍNH */}
            <div className="form-group">
              <label>Giới tính</label>
              <div className="custom-dropdown">
                <div
                  className={`dropdown-trigger ${openDropdown === "gender" ? "active" : ""}`}
                  onClick={() =>
                    setOpenDropdown(openDropdown === "gender" ? null : "gender")
                  }
                >
                  <span>
                    {
                      genderOptions.find((opt) => opt.value === form.gender)
                        ?.label
                    }
                  </span>
                  <svg
                    className={`icon-chevron ${openDropdown === "gender" ? "open" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                {openDropdown === "gender" && (
                  <div className="dropdown-menu">
                    {genderOptions.map((opt) => (
                      <div
                        key={opt.value}
                        className={`dropdown-item ${form.gender === opt.value ? "selected" : ""}`}
                        onClick={() => {
                          handleChange("gender", opt.value);
                          setOpenDropdown(null);
                        }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* DROPDOWN VAI TRÒ */}
            <div className="form-group">
              <label>Vai trò</label>
              <div className="custom-dropdown">
                <div
                  className={`dropdown-trigger ${openDropdown === "role" ? "active" : ""}`}
                  onClick={() =>
                    setOpenDropdown(openDropdown === "role" ? null : "role")
                  }
                >
                  <span>
                    {roleOptions.find((opt) => opt.value === form.role)?.label}
                  </span>
                  <svg
                    className={`icon-chevron ${openDropdown === "role" ? "open" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                {openDropdown === "role" && (
                  <div className="dropdown-menu">
                    {roleOptions.map((opt) => (
                      <div
                        key={opt.value}
                        className={`dropdown-item ${form.role === opt.value ? "selected" : ""}`}
                        onClick={() => {
                          handleChange("role", opt.value);
                          setOpenDropdown(null);
                        }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KIỂM TRA: CHỈ HIỂN THỊ DÒNG NÀY NẾU CÓ TRUYỀN USER VÀO (CHẾ ĐỘ EDIT) */}
          {user && (
            <div className="form-row">
              {/* DROPDOWN TRẠNG THÁI */}
              <div className="form-group">
                <label>Trạng thái</label>
                <div className="custom-dropdown">
                  <div
                    className={`dropdown-trigger ${openDropdown === "status" ? "active" : ""}`}
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === "status" ? null : "status",
                      )
                    }
                  >
                    <span>
                      {
                        statusOptions.find((opt) => opt.value === form.status)
                          ?.label
                      }
                    </span>
                    <svg
                      className={`icon-chevron ${openDropdown === "status" ? "open" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  {openDropdown === "status" && (
                    <div className="dropdown-menu">
                      {statusOptions.map((opt) => (
                        <div
                          key={opt.value}
                          className={`dropdown-item ${form.status === opt.value ? "selected" : ""}`}
                          onClick={() => {
                            handleChange("status", opt.value);
                            setOpenDropdown(null);
                          }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Cột trống để căn layout lưới 2 cột không bị vỡ */}
              <div className="form-group"></div>
            </div>
          )}
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
