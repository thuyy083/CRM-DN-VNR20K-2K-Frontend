import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { createService, updateService } from "../../services/servicesService";
import "./ServiceModal.scss";

// Sử dụng bản nâng cấp react-quill-new dành cho React 19
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const generateBaseCode = (name) => {
  if (!name) return "DV";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");
};

function ServiceModal({ services, service, close, reload }) {
  const [form, setForm] = useState({
    service_name: service?.service_name || service?.serviceName || "",
    description: service?.description || "", // Trường mô tả
    is_active: service ? (service.is_active ?? service.isActive ?? true) : true,
  });

  const [errors, setErrors] = useState({});
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Cấu hình thanh công cụ soạn thảo
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

  const executeSave = async () => {
    try {
      let finalServiceCode = service?.service_code || service?.serviceCode;

      if (!service) {
        const baseCode = generateBaseCode(form.service_name);
        const existingCodes = (services || []).map(
          (s) => s.service_code || s.serviceCode,
        );

        let finalCode = baseCode;
        let counter = 1;

        while (existingCodes.includes(finalCode)) {
          finalCode = `${baseCode}_${counter}`;
          counter++;
        }

        finalServiceCode = finalCode;
      }

      // Gộp thêm description vào dữ liệu gửi lên API
      const payloadToSend = {
        serviceCode: finalServiceCode,
        serviceName: form.service_name,
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

  const handleSubmitClick = () => {
    if (!form.service_name.trim()) {
      setErrors({ service_name: "Vui lòng nhập tên dịch vụ" });
      return;
    }

    if (!service) {
      const isDuplicateName = (services || []).some(
        (s) =>
          (s.service_name || s.serviceName || "").toLowerCase().trim() ===
          form.service_name.toLowerCase().trim(),
      );

      if (isDuplicateName) {
        setShowDuplicateWarning(true);
        return;
      }
    }

    executeSave();
  };

  return (
    <>
      <div className="modal">
        <div className="modal-box">
          <h3>{service ? "Cập nhật dịch vụ" : "Thêm dịch vụ mới"}</h3>

          <div className="form-content">
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
              <div style={{ height: "200px", marginBottom: "50px" }}>
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
            <button className="save-btn" onClick={handleSubmitClick}>
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>

      {/* DIALOG CẢNH BÁO TRÙNG TÊN DỊCH VỤ */}
      {showDuplicateWarning && (
        <div className="delete-modal-backdrop" style={{ zIndex: 1050 }}>
          <div className="delete-modal-box">
            <div
              style={{
                position: "relative",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                width: "60px",
                height: "60px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  backgroundColor: "#fef08a",
                  opacity: 0.6,
                  filter: "blur(8px)",
                  zIndex: -1,
                }}
              ></div>

              <svg
                width="46"
                height="46"
                viewBox="0 0 24 24"
                fill="#fef08a"
                stroke="#eab308"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <line x1="12" y1="9" x2="12" y2="13" stroke="#eab308" strokeWidth="3"></line>
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="#eab308" strokeWidth="3"></line>
              </svg>
            </div>

            <div className="delete-modal-content">
              <h2 className="delete-modal-title" style={{ marginTop: 0 }}>
                Cảnh báo trùng lặp
              </h2>
              <p className="delete-modal-text" style={{ lineHeight: "1.6" }}>
                Dịch vụ <strong>{form.service_name}</strong> đã tồn tại trong hệ thống. <br />
                Bạn có chắc chắn muốn tiếp tục tạo thêm một dịch vụ mới với tên này không?
              </p>
            </div>

            <div className="delete-modal-actions">
              <button
                className="delete-modal-btn cancel-btn"
                onClick={() => setShowDuplicateWarning(false)}
              >
                Không, quay lại
              </button>
              <button
                className="delete-modal-btn save-btn"
                style={{
                  backgroundColor: "#eab308",
                  color: "#fff",
                  borderColor: "#eab308",
                }}
                onClick={() => {
                  setShowDuplicateWarning(false);
                  executeSave();
                }}
              >
                Có, tạo mới
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ServiceModal;