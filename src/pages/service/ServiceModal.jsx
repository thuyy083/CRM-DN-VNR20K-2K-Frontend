import { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import { createService, updateService } from "../../services/servicesService";
import "./ServiceModal.scss";

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

function ServiceModal({ services, service, close, reload }) {
  const [form, setForm] = useState({
    service_code: service?.service_code || service?.serviceCode || "",
    service_name: service?.service_name || service?.serviceName || "",
    description: service?.description || "",
    is_active: service ? (service.is_active ?? service.isActive ?? true) : true,
  });

  const [errors, setErrors] = useState({});

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['clean']
    ],
  }), []);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  const handleSubmit = async () => {
    const trimmedCode = form.service_code.trim();
    const trimmedName = form.service_name.trim();

    // 1. Kiểm tra rỗng và bắn Toast
    if (!trimmedCode) {
      toast.error("Vui lòng nhập mã dịch vụ!");
      setErrors({ ...errors, service_code: "Vui lòng nhập mã dịch vụ" });
      return;
    }
    if (!trimmedName) {
      toast.error("Vui lòng nhập tên dịch vụ!");
      setErrors({ ...errors, service_name: "Vui lòng nhập tên dịch vụ" });
      return;
    }

    // Lọc danh sách dịch vụ khác (bỏ qua dịch vụ đang edit)
    const otherServices = (services || []).filter(s => s.id !== service?.id);

    // 2. Kiểm tra trùng mã dịch vụ
    const isDuplicateCode = otherServices.some(
      (s) => (s.service_code || s.serviceCode || "").toLowerCase() === trimmedCode.toLowerCase()
    );
    if (isDuplicateCode) {
      toast.error(`Mã dịch vụ "${trimmedCode}" đã tồn tại!`);
      return;
    }

    // 3. Kiểm tra trùng tên dịch vụ (hiện cảnh báo lỗi luôn để ngăn chặn tạo trùng)
    const isDuplicateName = otherServices.some(
      (s) => (s.service_name || s.serviceName || "").toLowerCase().trim() === trimmedName.toLowerCase()
    );
    if (isDuplicateName) {
      toast.warning(`Tên dịch vụ "${trimmedName}" đã tồn tại trong hệ thống!`);
      return;
    }

    // 4. Gọi API lưu dữ liệu
    try {
      const payloadToSend = {
        serviceCode: trimmedCode,
        serviceName: trimmedName,
        description: form.description,
        isActive: form.is_active,
      };

      if (service) {
        await updateService(service.id, payloadToSend);
        toast.success("Cập nhật dịch vụ thành công!");
      } else {
        await createService(payloadToSend);
        toast.success("Thêm dịch vụ mới thành công!");
      }

      await reload();
      close();
    } catch (error) {
      const errorMsg = error.response?.data?.message;
      if (Array.isArray(errorMsg)) {
        toast.error(errorMsg[0].message || errorMsg[0]);
      } else {
        toast.error(errorMsg || "Có lỗi xảy ra khi lưu dữ liệu!");
      }
    }
  };
  useEffect(() => {
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = "";
  };
}, []);

  return (
<div className="modal-overlay open" onClick={close}>
  <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3>{service ? "Cập nhật dịch vụ" : "Thêm dịch vụ mới"}</h3>

        <div className="form-content">
          {/* TRƯỜNG NHẬP MÃ DỊCH VỤ MỚI THÊM VÀO */}
          <div className="form-group">
            <label>
              Mã dịch vụ <span className="required">*</span>
            </label>
            <input
              className={errors.service_code ? "input-error" : ""}
              placeholder="VD: VIETTEL_CA"
              value={form.service_code}
              // Tự động viết hoa khi gõ cho mã đẹp hơn
              onChange={(e) => handleChange("service_code", e.target.value.toUpperCase())}
            />
            {errors.service_code && (
              <span className="error-text">{errors.service_code}</span>
            )}
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

          {/* KHUNG SOẠN THẢO MÔ TẢ */}
          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label style={{ marginBottom: "8px", display: "block" }}>
              Mô tả dịch vụ
            </label>
<div style={{ minHeight: "180px", marginBottom: "20px" }}>
                <ReactQuill
                theme="snow"
                value={form.description}
                modules={modules}
                placeholder="Nhập mô tả chi tiết, in đậm, in nghiêng..."
                onChange={(content) => handleChange("description", content)}
                style={{ height: "100%", fontFamily: "inherit" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Tình trạng bán</label>
            <select
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