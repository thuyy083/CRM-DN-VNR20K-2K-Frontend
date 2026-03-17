import { useState } from "react";
import { toast } from "react-toastify";
import { createService, updateService } from "../../services/servicesService";
import "./ServiceModal.scss";

function ServiceModal({ service, close, reload }) {
  // Đã sửa lại để tương thích với cả 2 kiểu dữ liệu trả về từ Backend
  const [form, setForm] = useState({
    service_code: service?.serviceCode || service?.service_code || "",
    service_name: service?.serviceName || service?.service_name || "",
    category: service?.category || "Chứng thực số",
    is_active: service ? (service.isActive ?? service.is_active ?? true) : true,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  const handleSubmit = async () => {
    const newErrors = {};
    let hasError = false;

    if (!form.service_code.trim()) {
      newErrors.service_code = "Vui lòng nhập mã dịch vụ";
      hasError = true;
    }
    if (!form.service_name.trim()) {
      newErrors.service_name = "Vui lòng nhập tên dịch vụ";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    try {
      // ==========================================
      // ĐOẠN "PHIÊN DỊCH" CHO BACKEND HIỂU
      // ==========================================
      const payloadToSend = {
        serviceCode: form.service_code,
        serviceName: form.service_name,
        category: form.category,
        isActive: form.is_active,
      };

      if (service) {
        // Gửi cái payloadToSend đi thay vì gửi form
        await updateService(service.id, payloadToSend);
        toast.success("Cập nhật dịch vụ thành công!");
      } else {
        // Gửi cái payloadToSend đi thay vì gửi form
        await createService(payloadToSend);
        toast.success("Thêm dịch vụ mới thành công!");
      }

      await reload();
      close();
    } catch (error) {
      const errorMsg = error.response?.data?.message;
      if (Array.isArray(errorMsg)) {
        toast.error(errorMsg[0]);
      } else {
        toast.error(errorMsg || "Có lỗi xảy ra khi lưu dữ liệu!");
      }
    }
  };

  return (
    <div className="modal">
      <div className="modal-box">
        <h3>{service ? "Cập nhật dịch vụ" : "Thêm dịch vụ mới"}</h3>

        <div className="form-content">
          <div className="form-row">
            <div className="form-group">
              <label>
                Mã dịch vụ <span className="required">*</span>
              </label>
              <input
                className={errors.service_code ? "input-error" : ""}
                placeholder="VD: V-CA, V-MYSIGN..."
                value={form.service_code}
                onChange={(e) => handleChange("service_code", e.target.value)}
                disabled={!!service}
                style={
                  service
                    ? {
                        backgroundColor: "#f3f4f6",
                        cursor: "not-allowed",
                        color: "#6b7280",
                      }
                    : {}
                }
              />
              {errors.service_code && (
                <span className="error-text">{errors.service_code}</span>
              )}
            </div>

            <div className="form-group">
              <label>Nhóm dịch vụ (Category)</label>
              <select
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
              >
                <option value="Chứng thực số">Chứng thực số</option>
                <option value="Cloud">Cloud</option>
                <option value="Viễn thông">Viễn thông</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>
              Tên đầy đủ dịch vụ <span className="required">*</span>
            </label>
            <input
              className={errors.service_name ? "input-error" : ""}
              placeholder="VD: Chữ ký số Viettel-CA"
              value={form.service_name}
              onChange={(e) => handleChange("service_name", e.target.value)}
            />
            {errors.service_name && (
              <span className="error-text">{errors.service_name}</span>
            )}
          </div>

          <div className="form-group">
            <label>Tình trạng bán</label>
            <select
              // Đã đổi thành String() để chống crash
              value={String(form.is_active)}
              onChange={(e) =>
                handleChange("is_active", e.target.value === "true")
              }
            >
              <option value="true">Đang bán (Active)</option>
              <option value="false">Đã ngừng cung cấp (Inactive)</option>
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={close}>
            Hủy
          </button>
          <button className="save-btn" onClick={handleSubmit}>
            Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  );
}

export default ServiceModal;
