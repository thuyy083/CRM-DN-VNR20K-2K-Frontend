import { useState } from "react";
import { toast } from "react-toastify";
import "./EnterpriseModal.scss";
import { createEnterprise, updateEnterprise } from "../../services/enterpriseService";


function EnterpriseModal({ enterprise, close, reload }) {
  const [form, setForm] = useState({
    name: enterprise?.name || "",
    taxCode: enterprise?.taxCode || "",
    industry: enterprise?.industry || "",
    employeeCount: enterprise?.employeeCount || "",
    address: enterprise?.address || "",
    website: enterprise?.website || "",
    phone: enterprise?.phone || "",
    status: enterprise?.status || "ACTIVE",
    note: enterprise?.note || "",
    contactFullName: "",
    contactEmail: "",
    contactPhone: "",
    contactPosition: "",
  });

  const handleChange = (field, value) => {
    setForm({
      ...form,
      [field]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (enterprise) {
        const {
          contactFullName,
          contactEmail,
          contactPhone,
          contactPosition,
          ...updatePayload
        } = form;
        await updateEnterprise(enterprise.id, updatePayload);
        toast.success("Cập nhật doanh nghiệp thành công");
      } else {
        await createEnterprise(form);
        toast.success("Thêm doanh nghiệp thành công");
      }

      await reload();
      close();
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra");
    }
  };

  return (
    <div className="modal">
      <div className="modal-box">
        <h3>{enterprise ? "Cập nhật doanh nghiệp" : "Thêm doanh nghiệp"}</h3>

        <div className="form-group">
          <label>Tên doanh nghiệp</label>
          <input
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Mã số thuế</label>
          <input
            value={form.taxCode}
            onChange={(e) => handleChange("taxCode", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Ngành nghề</label>
          <input
            value={form.industry}
            onChange={(e) => handleChange("industry", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Số nhân viên</label>
          <input
            type="number"
            value={form.employeeCount}
            onChange={(e) => handleChange("employeeCount", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Địa chỉ</label>
          <input
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Website</label>
          <input
            value={form.website}
            onChange={(e) => handleChange("website", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Điện thoại</label>
          <input
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Họ tên người liên hệ</label>
          <input
            value={form.contactFullName}
            onChange={(e) => handleChange("contactFullName", e.target.value)}
            placeholder="VD: Nguyễn Văn A"
            disabled={!!enterprise}
          />
        </div>

        <div className="form-group">
          <label>Email người liên hệ</label>
          <input
            value={form.contactEmail}
            onChange={(e) => handleChange("contactEmail", e.target.value)}
            placeholder="VD: nguyenvana@company.com"
            disabled={!!enterprise}
          />
        </div>

        <div className="form-group">
          <label>SĐT người liên hệ</label>
          <input
            value={form.contactPhone}
            onChange={(e) => handleChange("contactPhone", e.target.value)}
            placeholder="VD: 0987654321"
            disabled={!!enterprise}
          />
        </div>

        <div className="form-group">
          <label>Chức vụ người liên hệ</label>
          <input
            value={form.contactPosition}
            onChange={(e) => handleChange("contactPosition", e.target.value)}
            placeholder="VD: Giám đốc"
            disabled={!!enterprise}
          />
        </div>

        <div className="form-group">
          <label>Trạng thái</label>
          <select
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Ngưng hoạt động</option>
          </select>
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

export default EnterpriseModal;